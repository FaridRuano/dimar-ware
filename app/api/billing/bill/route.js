import connectMongoDB from "@libs/mongodb"
import Bill from "@models/billModel";
import Business from "@models/businessModel";
import Sale from "@models/saleModel";
import { documentAuthorization, documentReception } from "@node_modules/open-factura/dist";
import { NextResponse } from "next/server"
import forge from 'node-forge';
import { create } from "@node_modules/xmlbuilder2/lib";
import fs from 'fs'
import AWS from '@node_modules/aws-sdk'
import axios from "@node_modules/axios";


// Configura AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION,
})

let s3 = new AWS.S3({
    accesKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

async function getP12S3() {
    const params = {
        Bucket: 'firma-electronica-bucket', // Cambia esto por el nombre de tu bucket
        Key: 'firma.p12',
    }

    try {
        const res = await s3.getObject(params).promise() // Usamos `promise()` para esperar la respuesta

        if (!res.Body) {
            throw new Error("No se encontró el archivo.")
        }

        const arrayBuffer = res.Body.buffer ? res.Body.buffer : res.Body
        return arrayBuffer
    } catch (error) {
        console.error("Error al obtener el archivo desde S3:", error)
        throw error
    }
}



function chooseTypeClient(type) {
    switch (type) {
        case "Cédula":
            return '04'
        case "RUC":
            return '05'
    }
}

function getPayMethod(method) {

    switch (method) {
        case "SIN UTILIZACION DEL SISTEMA FINANCIERO":
            return "01"
        case "COMPENSACIÓN DE DEUDAS":
            return "15"
        case "TARJETA DE DÉBITO ":
            return "16"
        case "DINERO ELECTRÓNICO":
            return "17"
        case "TARJETA PREPAGO":
            return "18"
        case "TARJETA DE CRÉDITO":
            return "19"
        case "OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO":
            return "20"
        case "ENDOSO DE TÍTULOS":
            return "20"
        default:
            return "01"
    }
}

function getDiscountTotal(cart) {
    let totalDiscount = 0

    cart.forEach(product => {
        const discount = product.price * (product.desc / 100);

        totalDiscount += discount * product.amount
    });

    return totalDiscount.toFixed(2)
}

function formatDateToDDMMYYYY(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateToDDMMYYYY2(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1; // getMonth() returns 0-11
    let year = date.getFullYear();

    // Pad day and month with a leading zero if they are less than 10
    const finalDay = day < 10 ? "0" + day : day;
    const finalMonth = month < 10 ? "0" + month : month;

    return `${finalDay}${finalMonth}${year}`;
}

function generateRandomEightDigitNumber() {
    const min = 10000000;
    const max = 99999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVerificatorDigit(accessKey) {
    let result = 0;
    let addition = 0;
    let multiple = 7;
    for (let i = 0; i < accessKey.length; i++) {
        addition += parseInt(accessKey.charAt(i)) * multiple;
        multiple > 2 ? multiple-- : (multiple = 7);
    }
    result = 11 - (addition % 11);
    result === 10 ? (result = 1) : (result = result);
    result === 11 ? (result = 0) : (result = result);
    return result;
}

function generateAccessKey(sale, business) {
    let accessKey = "";
    accessKey += formatDateToDDMMYYYY2(sale.createdAt)
    accessKey += sale.codDoc
    accessKey += business.ruc
    accessKey += '1'
    accessKey += business.establecimiento
    accessKey += sale.ptoEmi
    accessKey += sale.secuencial.toString().padStart(9, '0')
    accessKey += generateRandomEightDigitNumber()
    accessKey += "1"
    accessKey += generateVerificatorDigit(accessKey)
    return accessKey;
}

const createBillFromSales = (sales, business) => {
    return {
        infoTributaria: {
            ambiente: "1", // Estático o según tu lógica
            tipoEmision: "1",
            razonSocial: business.razonSocial,
            nombreComercial: business.nombreComercial,
            ruc: business.ruc,
            claveAcceso: generateAccessKey(sales, business),
            codDoc: sales.codDoc,
            estab: business.establecimiento,
            ptoEmi: sales.ptoEmi,
            secuencial: sales.secuencial.toString().padStart(9, '0'),
            dirMatriz: business.direccion,
        },
        infoFactura: {
            fechaEmision: formatDateToDDMMYYYY(new Date()),
            tipoIdentificacionComprador: chooseTypeClient(sales.billData.type),
            razonSocialComprador: sales.billData.name,
            identificacionComprador: sales.billData.dni,
            direccionComprador: sales.billData.address,
            totalSinImpuestos: sales.subtotal.toFixed(2),
            totalDescuento: getDiscountTotal(sales.cart),
            totalConImpuestos: {
                totalImpuesto: [
                    {
                        codigo: "2", // IVA
                        codigoPorcentaje: "4",
                        descuentoAdicional: 0,
                        baseImponible: sales.subtotal.toFixed(2),
                        valor: sales.iva.toFixed(2),
                    },
                ],
            },
            importeTotal: sales.total.toFixed(2),
            moneda: "DOLAR",
            pagos: [
                {
                    pago: {
                        formaPago: getPayMethod(sales.paymentMethod),
                        total: sales.total.toFixed(2),
                    }
                }
            ]
        },
        detalles: {
            detalle: sales.cart.map((item) => ({
                codigoPrincipal: item.cod,
                descripcion: item.name,
                cantidad: parseFloat(item.amount),
                precioUnitario: item.price.toFixed(2),
                descuento: item.desc.toFixed(2),
                precioTotalSinImpuesto: (item.total / 1.15).toFixed(2),
                impuestos: {
                    impuesto: [
                        {
                            codigo: "2",
                            codigoPorcentaje: "4",
                            tarifa: 15.00,
                            baseImponible: (item.total / 1.15).toFixed(2),
                            valor: item.total
                        }
                    ]
                }
            })),
        },
        infoAdicional: {
            campoAdicional: [
                { "Correo": sales.billData.email },
                { "Teléfono": sales.billData.phone },
            ],
        },
    }
}

const generateInvoice = (invoiceData) => {
    const invoice = {
        factura: {
            /*             "@xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
                        "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance", */
            "@id": "comprobante",
            "@version": "1.1.0",
            infoTributaria: invoiceData.infoTributaria,
            infoFactura: invoiceData.infoFactura,
            detalles: invoiceData.detalles,
        },
    }
    return invoice
}

function generateInvoiceXml(invoice) {
    const document = create(invoice);
    const xml = document.end({ prettyPrint: true });
    return xml
}

function sha1Base64(text, encoding) {
    let md = forge.md.sha1.create()
    md.update(text, encoding)
    const hash = md.digest().toHex()
    const buffer = Buffer(hash, "hex")
    const base64 = buffer.toString("base64")
    return base64
}

function hexToBase64(hex) {
    hex = hex.padStart(hex.length + (hex.length % 2), "0")

    const bytes = hex.match(/.{2}/g).map((byte) => parseInt(byte, 16))

    const binaryString = String.fromCharCode(...bytes)

    return btoa(binaryString)
}

function bigIntToBase64(bigInt) {
    const hex = bigInt.toString(16)
    const hexPairs = hex.match(/\w{2}/g)
    const bytes = hexPairs.map((pair) => parseInt(pair, 16))
    const byteString = String.fromCharCode(...bytes)
    const base64 = btoa(byteString)
    const formatedBase64 = base64.match(/.{1,76}/g).join("\n")
    return formatedBase64
}

function getRandomNumber(min = 990, max = 9999) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function validar_xml(xml) {

    const signed_xml = xml
    // Ruta del archivo WSDL
    const wsdl_url = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
    // const wsdl_url = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

    try {
        // Codificar el contenido XML en base64
        const xml_bytes = Buffer.from(signed_xml, 'utf-8');
        const xml_base64 = xml_bytes.toString('base64');

        // Configurar la solicitud SOAP
        const xml_request = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
                <soapenv:Header/>
                <soapenv:Body>
                    <ec:validarComprobante>
                        <xml>${xml_base64}</xml>
                    </ec:validarComprobante>
                </soapenv:Body>
            </soapenv:Envelope>
        `;

        // Realizar la solicitud POST a la URL del servicio web con Axios
        const response = await axios.post(wsdl_url, xml_request, {
            headers: {
                'Content-Type': 'text/xml',
            },
        });

        // Procesar la respuesta del servicio web
        const resultXML = response.data;
        return resultXML.toString();

    } catch (error) {
        // Manejar errores, por ejemplo, mostrar un mensaje de error
        console.error("Error al validar el XML:", error);
        return "Error al validar el XML";
    }
}

async function signXml(p12Password, invoiceXml) {

    const arrayBuffer = await getP12S3()
    let xml = invoiceXml

    xml = xml
        .replace(/\s+/g, " ")
        .trim()
        .replace(/(?<=\>)(\r?\n)|(\r?\n)(?=\<\/)/g, "")
        .trim()
        .replace(/(?<=\>)(\s*)/g, "")

    const arrayUint8 = new Uint8Array(arrayBuffer)
    const base64 = forge.util.binary.base64.encode(arrayUint8)
    const der = forge.util.decode64(base64)

    const asn1 = forge.asn1.fromDer(der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, p12Password)
    const pkcs8Bags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    })
    const certBags = p12.getBags({
        bagType: forge.pki.oids.certBag,
    })

    const certBag = certBags[(forge).oids.certBag]

    const friendlyName = certBag[1].attributes.friendlyName[0]


    let certificate
    let pkcs8
    let issuerName = ""

    const cert = certBag.reduce((prev, curr) => {
        const attributes = curr.cert.extensions
        return attributes.length > prev.cert.extensions.length ? curr : prev
    })

    const issueAttributes = cert.cert.issuer.attributes

    issuerName = issueAttributes
        .reverse()
        .map((attribute) => {
            return `${attribute.shortName}=${attribute.value}`
        })
        .join(", ")


    if (/BANCO CENTRAL/i.test(friendlyName)) {
        let keys = pkcs8Bags[(forge).oids.pkcs8ShroudedKeyBag]
        for (let i = 0; i < keys.length; i++) {
            const element = keys[i]
            let name = element.attributes.friendlyName[0]
            if (/Signing Key/i.test(name)) {
                pkcs8 = pkcs8Bags[(forge).oids.pkcs8ShroudedKeyBag[i]]
            }
        }
    }

    if (/SECURITY DATA/i.test(friendlyName)) {
        pkcs8 = pkcs8Bags[(forge).oids.pkcs8ShroudedKeyBag][0]
    }

    certificate = cert.cert

    const notBefore = certificate.validity["notBefore"]
    const notAfter = certificate.validity["notAfter"]
    const date = new Date()

    if (date < notBefore || date > notAfter) {
        throw new Error("Expired certificate");
    }

    const key = pkcs8.key ?? pkcs8.asn1
    const certificateX509_pem = forge.pki.certificateToPem(certificate)

    let certificateX509 = certificateX509_pem.substring(
        certificateX509_pem.indexOf("\n") + 1,
        certificateX509_pem.indexOf("\n-----END CERTIFICATE-----")
    )

    certificateX509 = certificateX509
        .replace(/\r?\n|\r/g, "")
        .replace(/([^\0]{76})/g, "$1\n")

    const certificateX509_asn1 = forge.pki.certificateToAsn1(certificate)
    const certificateX509_der = forge.asn1.toDer(certificateX509_asn1).getBytes()
    const hash_certificateX509_der = sha1Base64(certificateX509_der)
    const certificateX509_serialNumber = parseInt(certificate.serialNumber, 16)

    const exponent = hexToBase64(key.e.data[0].toString(16))
    const modulus = bigIntToBase64(key.n)

    xml = xml.replace(/\t|\r/g, "")

    const sha1_xml = sha1Base64(
        xml.replace('<?xml version="1.0" encoding="UTF-8"?>', ""),
        "utf8"
    )

    const nameSpaces =
        'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"';

    const certificateNumber = getRandomNumber()
    const signatureNumber = getRandomNumber()
    const signedPropertiesNumber = getRandomNumber()
    const signedInfoNumber = getRandomNumber()
    const signedPropertiesIdNumber = getRandomNumber()
    const referenceIdNumber = getRandomNumber()
    const signatureValueNumber = getRandomNumber()
    const objectNumber = getRandomNumber()

    const isoDateTime = date.toISOString().slice(0, 19)

    let signedProperties = ""
    signedProperties +=
        '<etsi:SignedProperties Id="Signature' +
        signatureNumber +
        "-SignedProperties" +
        signedPropertiesNumber +
        '">'

    signedProperties += "<etsi:SignedSignatureProperties>"
    signedProperties += "<etsi:SigningTime>"
    signedProperties += isoDateTime
    signedProperties += "</etsi:SigningTime>"
    signedProperties += "<etsi:SigningCertificate>"
    signedProperties += "<etsi:Cert>"
    signedProperties += "<etsi:CertDigest>"
    signedProperties +=
        '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedProperties += "</ds:DigestMethod>"
    signedProperties += "<ds:DigestValue>"
    signedProperties += hash_certificateX509_der
    signedProperties += "</ds:DigestValue>"
    signedProperties += "</etsi:CertDigest>"
    signedProperties += "<etsi:IssuerSerial>"
    signedProperties += "<ds:X509IssuerName>"
    signedProperties += issuerName
    signedProperties += "</ds:X509IssuerName>"
    signedProperties += "<ds:X509SerialNumber>"
    signedProperties += certificateX509_serialNumber
    signedProperties += "</ds:X509SerialNumber>"
    signedProperties += "</etsi:IssuerSerial>"
    signedProperties += "</etsi:Cert>"
    signedProperties += "</etsi:SigningCertificate>"
    signedProperties += "</etsi:SignedSignatureProperties>"

    signedProperties += "<etsi:SignedDataObjectProperties>"
    signedProperties +=
        '<etsi:DataObjectFormat ObjectReference="#Reference-ID=' +
        referenceIdNumber +
        '">'
    signedProperties += "<etsi:Description>"
    signedProperties += "contenido comprobante"
    signedProperties += "</etsi:Description>"
    signedProperties += "<etsi:MimeType>"
    signedProperties += "text/xml"
    signedProperties += "</etsi:MimeType>"
    signedProperties += "</etsi:DataObjectFormat>"
    signedProperties += "</etsi:SignedDataObjectProperties>"
    signedProperties += "</etsi:SignedProperties>"

    const sha1SignedProperties = sha1Base64(
        signedProperties.replace(
            "<ets:SignedProperties",
            "<etsi:SignedProperties " + nameSpaces
        ),
    )

    let keyInfo = ""
    keyInfo += '<ds:KeyInfo Id="Certificate' + certificateNumber + '">'
    keyInfo += "\n<ds:X509Data>"
    keyInfo += "\n<ds:X509Certificate>\n"
    keyInfo += certificateX509
    keyInfo += "\n</ds:X509Certificate>"
    keyInfo += "\n</ds:X509Data>"
    keyInfo += "\n<ds:KeyValue>"
    keyInfo += "\n<ds:RSAKeyValue>"
    keyInfo += "\n<ds:Modulus>\n"
    keyInfo += modulus
    keyInfo += "\n</ds:Modulus>"
    keyInfo += "\n<ds:Exponent>"
    keyInfo += exponent
    keyInfo += "</ds:Exponent>"
    keyInfo += "\n</ds:RSAKeyValue>"
    keyInfo += "\n</ds:KeyValue>"
    keyInfo += "\n</ds:KeyInfo>"

    const sha1KeyInfo = sha1Base64(
        keyInfo.replace("<ds:KeyInfo", "<ds:KeyInfo " + nameSpaces),
    )

    let signedInfo = ""
    signedInfo +=
        '<ds:SignedInfo Id="Signature-SignedInfo' + signedInfoNumber + '">'
    signedInfo +=
        '\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315">'
    signedInfo += "</ds:CanonicalizationMethod>"
    signedInfo +=
        '\n<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">'
    signedInfo += "</ds:SignatureMethod>"
    signedInfo +=
        '\n<ds:Reference Id="SignedPropertiesID' +
        signedPropertiesIdNumber +
        '" Type="http://uri.etsi.org/01903#SignedProperties" URI="#Signature' +
        signatureNumber +
        "-SignedProperties" +
        signedPropertiesNumber +
        '">'
    signedInfo +=
        '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedInfo += "</ds:DigestMethod>"
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha1SignedProperties
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>\n"
    signedInfo += '\n<ds:Reference URI="#Certificate' + certificateNumber + '">'
    signedInfo +=
        '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedInfo += "</ds:DigestMethod>"
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha1KeyInfo
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>"

    signedInfo +=
        '\n<ds:Reference Id="Reference-ID' +
        referenceIdNumber +
        '" URI="#comprobante">'
    signedInfo += "\n<ds:Transforms>"
    signedInfo +=
        '\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmlndsig#enveloped-signature">'
    signedInfo += "</ds:Transform>"
    signedInfo += "\n</ds:Transforms>"
    signedInfo +=
        '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedInfo += "</ds:DigestMethod>"
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha1_xml
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>"

    signedInfo += "\n</ds:SignedInfo>"

    const canonicalizedSignedInfo = signedInfo.replace(
        "<ds:SignedInfo",
        "<ds:SignedInfo " + nameSpaces
    )

    const md = forge.md.sha1.create()
    md.update(canonicalizedSignedInfo, "utf8")

    let signature = btoa(key.sign(md))
        .match(/.{1,76}/g)
        .join("\n")

    let xadesBes = ""
    xadesBes += "<ds:Signature " + nameSpaces + ' Id="Signature' + signatureNumber + '">'
    xadesBes += "\n" + signedInfo

    xadesBes +=
        '\n<ds:SignatureValue Id="SignatureValue' + signatureValueNumber + '">\n'

    xadesBes += signature
    xadesBes += "\n</ds:SignatureValue>"
    xadesBes += "\n" + keyInfo
    xadesBes +=
        '\n<ds:Object Id="Signature' +
        signatureNumber +
        "-Object" +
        objectNumber +
        '">';

    xadesBes +=
        '<etsi:QualifyingProperties Target="#Signature' + signatureNumber + '">';
    xadesBes += signedProperties;

    xadesBes += "</etsi:QualifyingProperties>";
    xadesBes += "</ds:Object>";
    xadesBes += "\n</ds:Signature>\n";

    return xml.replace(/(<[^<]+)$/, xadesBes + "$1");
}

export async function POST(request) {
    try {

        await connectMongoDB();

        const { id, method, biller, codDoc, ptoEmi } = await request.json()

        if (!id || !method) {
            return NextResponse.json(
                { message: "Data is missing!" },
                { status: 400 }
            );
        }

        const saleData = await Sale.findOne({ _id: id })

        if (!saleData) {
            return NextResponse.json(
                { message: "Sale not found!" },
                { status: 404 }
            )
        }

        const lastInvoice = await Sale.find()
            .sort({ secuencial: -1 })
            .limit(1)

        let newSecuencial = 1

        if (lastInvoice.length > 0) {
            newSecuencial = lastInvoice[0].secuencial + 1
        }

        await Sale.updateOne(
            { _id: id },
            {
                $set: {
                    paymentMethod: method,
                    status: 'Por Entregar',
                    biller: biller,
                    secuencial: newSecuencial,
                    codDoc: codDoc,
                    ptoEmi: ptoEmi,
                },
            },
        )

        const updatedSale = await Sale.findOne({ _id: id })

        const business = await Business.findOne({ ruc: '1805467527001' })

        const json = createBillFromSales(updatedSale, business)

        await Bill.create(json)

        const invoice = generateInvoice(json)

        const invoiceXml = generateInvoiceXml(invoice)

        const signedXml = await signXml(business.pwP12, invoiceXml)

        const receptionResult = await validar_xml(signedXml)

        const authorizationResult = await documentAuthorization(
            json.infoTributaria.claveAcceso,
            process.env.SRI_AUTHORIZATION_URL
        )

        return NextResponse.json(
            {
                msg: authorizationResult
            },
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong: " + error
            },
            {
                status: 200
            }
        )
    }
}