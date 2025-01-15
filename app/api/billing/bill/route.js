import connectMongoDB from "@libs/mongodb"
import Bill from "@models/billModel"
import Business from "@models/businessModel"
import Sale from "@models/saleModel"
import { NextResponse } from "next/server"
import forge from 'node-forge'
import { create } from "@node_modules/xmlbuilder2/lib"
import AWS from '@node_modules/aws-sdk'
import axios from "@node_modules/axios"
import { documentAuthorization, documentReception } from "@node_modules/open-factura/dist"
var xadesjs = require("xadesjs")
var { Crypto } = require("@peculiar/webcrypto")
import nodemailer from 'nodemailer';


// Configura AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION,
})

let s3 = new AWS.S3({
    accesKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
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

        // Convertir a una cadena binaria
        const binaryP12 = res.Body.toString('binary');

        // Convertir a ASN.1 para usar con forge
        const p12Asn1 = forge.asn1.fromDer(binaryP12);

        return p12Asn1;
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
    accessKey += formatDateToDDMMYYYY2(new Date())
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
            dirEstablecimiento: business.direccion,
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
                {
                    '@nombre': 'Email',
                    "#text": sales.billData.email
                },
                {
                    '@nombre': 'Teléfono',
                    "#text": sales.billData.phone
                }
            ]
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
            infoAdicional: invoiceData.infoAdicional
        },
    }
    return invoice
}

function generateInvoiceXml(invoice) {
    const document = create(invoice);
    const xml = document.end({ prettyPrint: true });
    return xml
}

function sha1Base64(text, encoding = 'utf8') {
    let md = forge.md.sha1.create()
    md.update(text, encoding)
    const hash = md.digest().getBytes()
    const buffer = Buffer.from(hash, "binary")
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
    return base64
}

function getRandomNumber(min = 100000, max = 999999) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function calculateDigestValue(xmlContent, isSignedProps = false) {
    // Aplicar transformaciones si es necesario
    if (!isSignedProps) {
        // Transformación "enveloped-signature" (eliminar la firma de dentro del contenido XML)
        const signedTag = /<ds:Signature[^>]*>.*<\/ds:Signature>/s;
        xmlContent = xmlContent.replace(signedTag, '');  // Eliminar cualquier <ds:Signature>
    }

    // Usar SHA-256 para calcular el Digest
    const md = forge.md.sha256.create();
    md.update(xmlContent, 'utf8');  // Asumimos que el XML está en formato UTF-8
    const digest = md.digest();

    // Codificar el resultado del hash en Base64
    const base64Digest = forge.util.encode64(digest.getBytes());
    return base64Digest;
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

async function signXml2(p12Password, invoiceXml) {

    /* ================ASSETS======================= */

    const nameSpaces =
        'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"'

    let xml = invoiceXml

    xml = xml
        .replace(/\s+/g, " ")
        .trim()
        .replace(/(?<=\>)(\r?\n)|(\r?\n)(?=\<\/)/g, "")
        .trim()
        .replace(/(?<=\>)(\s*)/g, "")

    /* ===============FIRMA DIGITAL================= */

    const p12Asn1 = await getP12S3()

    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password)

    /* CERT509 */

    let certx509PEM = null;
    for (const safeContent of p12.safeContents) {
        for (const safeBag of safeContent.safeBags) {
            if (safeBag.type === forge.pki.oids.certBag) {
                certx509PEM = forge.pki.certificateToPem(safeBag.cert);
                break;
            }
        }
        if (certx509PEM) break;
    }

    // Extraer el contenido base64 del certificado PEM
    const certMatch = certx509PEM.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
    if (!certMatch || certMatch.length < 2) {
        throw new Error('El certificado no tiene un formato válido.');
    }

    // Obtener el contenido base64 del certificado
    let certx509 = certMatch[1].replace(/\r?\n|\r/g, '');

    // Formatear el certificado base64 en líneas de 76 caracteres (opcional)
    certx509 = certx509.replace(/(.{76})/g, '$1\n');

    /* PUBLIC KEY */

    const bags = p12.getBags({ bagType: forge.pki.oids.certBag })

    const certBag = bags[forge.pki.oids.certBag][0]
    const cert = certBag.cert

    const publicKey = cert.publicKey

    /* MODULUS */

    let modulus = bigIntToBase64(publicKey.n)

    modulus = modulus.replace(/(.{76})/g, '$1\n')

    /* EXPONENT */

    let exponent = hexToBase64(publicKey.e.data[0].toString(16))

    /* HASH-CERT */

    const cert_asn1 = forge.pki.certificateToAsn1(cert)
    const cert_der = forge.asn1.toDer(cert_asn1).getBytes()
    const cert_hash = sha1Base64(cert_der)

    /* ISSUERNAME */

    const issuerName = cert.issuer.attributes.reverse().map(attr => {
        return `${attr.shortName}=${attr.value}`
    }).join(', ')

    /* SERIALNUMBER */

    const serialNumber = parseInt(cert.serialNumber, 16)

    /* ============================================= */

    /* =================KEYINFO===================== */

    const certNumb = getRandomNumber()

    let keyInfo = ""

    keyInfo += '<ds:KeyInfo Id="Certificate' + certNumb + '">'
    keyInfo += "\n<ds:X509Data>"
    keyInfo += "\n<ds:X509Certificate>"
    keyInfo += certx509
    keyInfo += "</ds:X509Certificate>"
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


    /* ============================================= */

    /* ============SIGNATUREPROPERTIES============== */

    const date = new Date();

    const isoString = date.toISOString()

    const timeZoneOffset = -5
    const isoFormatDate = isoString.replace('Z', `${timeZoneOffset < 0 ? '-' : '+'}${String(Math.abs(timeZoneOffset)).padStart(2, '0')}:00`)

    const signedPropertiesNumb = getRandomNumber()
    const referenceIdNumb = getRandomNumber()
    const signedInfoNumb = getRandomNumber()
    const signatureNumb = getRandomNumber()

    let signedProperties = ""
    signedProperties +=
        '<etsi:SignedProperties Id="Signature' +
        signatureNumb +
        "-SignedProperties" +
        signedPropertiesNumb +
        '">'/*  */
    signedProperties += "<etsi:SignedSignatureProperties>"
    signedProperties += "<etsi:SigningTime>"
    signedProperties += isoFormatDate
    signedProperties += "</etsi:SigningTime>"
    signedProperties += "<etsi:SigningCertificate>"
    signedProperties += "<etsi:Cert>"
    signedProperties += "<etsi:CertDigest>"
    signedProperties += '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedProperties += "</ds:DigestMethod>"
    signedProperties += "<ds:DigestValue>"
    signedProperties += cert_hash
    signedProperties += "</ds:DigestValue>"
    signedProperties += "</etsi:CertDigest>"
    signedProperties += "<etsi:IssuerSerial>"
    signedProperties += "<ds:X509IssuerName>"
    signedProperties += issuerName
    signedProperties += "</ds:X509IssuerName>"
    signedProperties += "<ds:X509SerialNumber>"
    signedProperties += serialNumber
    signedProperties += "</ds:X509SerialNumber>"
    signedProperties += "</etsi:IssuerSerial>"
    signedProperties += "</etsi:Cert>"
    signedProperties += "</etsi:SigningCertificate>"
    signedProperties += "</etsi:SignedSignatureProperties>"
    signedProperties += "<etsi:SignedDataObjectProperties>"
    signedProperties += '<etsi:DataObjectFormat ObjectReference="#Reference-ID-' +
        referenceIdNumb +
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

    /* ============================================= */

    /* =================SIGNINFO==================== */

    const signedPropertiesIdNumb = getRandomNumber()

    /* SIGNEDPROPERTIES CANONICALIZATED */

    const canonSignedProp = signedProperties.replace(
        "<etsi:SignedProperties",
        "<etsi:SignedProperties " + nameSpaces
    )

    const sha1SignedProperties = sha1Base64(canonSignedProp)

    const canonKeyInfo = keyInfo.replace(
        "<ds:KeyInfo",
        "<ds:KeyInfo" + nameSpaces
    )

    const sha1KeyInfo = sha1Base64(canonKeyInfo)

    const sha1Comprobante = sha1Base64(invoiceXml.replace('<?xml version="1.0" encoding="UTF-8"?>', ""))

    let signedInfo = ""
    signedInfo += '<ds:SignedInfo Id="Signature-SignedInfo' + signedInfoNumb + '">'
    signedInfo += '\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315">'
    signedInfo += "</ds:CanonicalizationMethod>"
    signedInfo += '\n<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">'
    signedInfo += "</ds:SignatureMethod>"
    signedInfo += '\n<ds:Reference Id="SignedPropertiesID' +
        signedPropertiesIdNumb +
        '" Type="http://uri.etsi.org/01903#SignedProperties" URI="#Signature' +
        signatureNumb +
        "-SignedProperties" +
        signedPropertiesNumb +
        '">'
    signedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedInfo += "</ds:DigestMethod>"
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha1SignedProperties
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>\n"
    signedInfo += '\n<ds:Reference URI="#Certificate' + certNumb + '">'
    signedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedInfo += "</ds:DigestMethod>"
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha1KeyInfo
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>"
    signedInfo += '\n<ds:Reference Id="Reference-ID' +
        referenceIdNumb +
        '" URI="#comprobante">'
    signedInfo += "\n<ds:Transforms>"
    signedInfo += '\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmlndsig#enveloped-signature">'
    signedInfo += "</ds:Transform>"
    signedInfo += "\n</ds:Transforms>"
    signedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">'
    signedInfo += "</ds:DigestMethod>"
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha1Comprobante
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>"
    signedInfo += "\n</ds:SignedInfo>"

    /* ============================================= */

    /* =================SIGNATUREVALUE============= */

    const signatureValueNumb = getRandomNumber()
    const objectNumb = getRandomNumber()

    const canonicalizedSignedInfo = signedInfo.replace(
        "<ds:SignedInfo",
        "<ds:SignedInfo " + nameSpaces
    )


    /* PRIVATE KEY */
    // Obtener las llaves privadas del archivo .p12
    const pkcs8Bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

    if (pkcs8Bags.length === 0) {
        throw new Error('No private key found in the .p12 file')
    }

    const pkcs8 = pkcs8Bags[(forge).oids.pkcs8ShroudedKeyBag][0]

    let key = pkcs8.key

    const md = forge.md.sha1.create()
    md.update(canonicalizedSignedInfo, "utf8")

    let signature = btoa(key.sign(md))
        .match(/.{1,76}/g)
        .join("\n")

    let xadesBes = ""
    xadesBes += "\n<ds:Signature " + nameSpaces + ' Id="Signature' + signatureNumb + '">'
    xadesBes += "\n" + signedInfo

    xadesBes +=
        '\n<ds:SignatureValue Id="SignatureValue' + signatureValueNumb + '">\n'
    xadesBes += signature
    xadesBes += "\n</ds:SignatureValue>"
    xadesBes += "\n" + keyInfo
    xadesBes +=
        '\n<ds:Object Id="Signature' +
        signatureNumb +
        "-Object" +
        objectNumb +
        '">';

    xadesBes +=
        '<etsi:QualifyingProperties Target="#Signature' + signatureNumb + '">';
    xadesBes += signedProperties;

    xadesBes += "</etsi:QualifyingProperties>";
    xadesBes += "</ds:Object>";
    xadesBes += "\n</ds:Signature>\n";

    /* ============================================= */

    return xml.replace(/(<[^<]+)$/, xadesBes + "$1")
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

    const asn1 = arrayBuffer
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, p12Password)

    /* =================PUBLIC CERT PEM==================*/

    let publicCertPem = null

    p12.safeContents.forEach(safeContent => {
        safeContent.safeBags.forEach(safeBag => {
            if (safeBag.type === forge.pki.oids.certBag) {
                const cert = safeBag.cert  // Certificado público en formato X.509
                publicCertPem = forge.pki.certificateToPem(cert)  // Convertir a PEM
            }
        })
    })

    /* ========================== */

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
        'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"'

    const certificateNumber = getRandomNumber()
    const signatureNumber = getRandomNumber()
    const signedPropertiesNumber = getRandomNumber()
    const signedInfoNumber = getRandomNumber()
    const signedPropertiesIdNumber = getRandomNumber()
    const referenceIdNumber = getRandomNumber()
    const signatureValueNumber = getRandomNumber()
    const objectNumber = getRandomNumber()

    const isoDateTime = date.toISOString().slice(0, 19)

    /*==================HASH PUBLIC CERT PEM================*/

    /* let pubCert = forge.pki.certificateFromPem(publicCertPem)
    const mdPCP = forge.md.sha1.create()
    mdPCP.update(pubCert.getEncoded())
    let certDigest = mdPCP.digest().toBase64() */

    /* ============================== */

    let signedProperties = ""
    signedProperties +=
        '<etsi:SignedProperties Id="Signature' +
        signatureNumber +
        "-SignedProperties" +
        signedPropertiesNumber +
        '">'/*  */

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
        '<etsi:DataObjectFormat ObjectReference="#Reference-ID-' +
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

    const refOneCanonString = signedProperties.replace(
        "<etsi:SignedProperties",
        "<etsi:SignedProperties " + nameSpaces
    )

    const sha1SignedProperties = sha1Base64(refOneCanonString)

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
    keyInfo += /*  */"\n</ds:KeyInfo>"

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
    xadesBes += "\n<ds:Signature " + nameSpaces + ' Id="Signature' + signatureNumber + '">'
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


/* async function signXml(p12Password, invoiceXml) {

    const arrayBuffer = await getP12S3()
    let xml = invoiceXml

    const asn1 = arrayBuffer
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, p12Password)
    const pkcs8Bags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    })
    const certBags = p12.getBags({
        bagType: forge.pki.oids.certBag,
    })

    const certBag = Object.values(certBags)[0]

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

    certificateX509 = certificateX509.replace(/(\r\n|\n|\r)/g, "");

    const certificateX509_asn1 = forge.pki.certificateToAsn1(certificate)
    const certificateX509_der = forge.asn1.toDer(certificateX509_asn1).getBytes()
    const hash_certificateX509_der = forge.md.sha256.create().update(certificateX509_der).digest();
    const base64_digest = forge.util.encode64(hash_certificateX509_der.getBytes())
    const certificateX509_serialNumber = parseInt(certificate.serialNumber, 16)

    xml = xml

    const nameSpaces =
        'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"'

    const referenceIdNumber = getRandomNumber()
    const uniqueId = generateUniqueId()

    //Digest Value Comprobante

    const sha256DVComp = calculateDigestValue(invoiceXml)

    //Digest Value Sign Props

    const signedPropsXml = `
        <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties"
            URI="${uniqueId}-signedprops">
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
            <ds:DigestValue>${sha256DVComp}</ds:DigestValue>
        </ds:Reference>
    `
    const sha256DVSignprops = calculateDigestValue(signedPropsXml, true)

    let signedInfo = ""
    signedInfo +=
        '<ds:SignedInfo>'
    signedInfo +=
        '\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>'
    signedInfo +=
        '\n<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>';
    signedInfo +=
        '\n<ds:Reference Id="' +
        uniqueId + '-ref0' +
        '" URI="#comprobante"' + '>'
    signedInfo +=
        '\n<ds:Transforms>'
    signedInfo +=
        '\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>'
    signedInfo +=
        '\n</ds:Transforms>'
    signedInfo +=
        '\n<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>';
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha256DVComp
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>"
    signedInfo += '\n<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties"'
        + 'URI="'
        + uniqueId
        + '-signedprops"'
        + '>'
    signedInfo +=
        '\n<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>'
    signedInfo += "\n<ds:DigestValue>"
    signedInfo += sha256DVSignprops
    signedInfo += "</ds:DigestValue>"
    signedInfo += "\n</ds:Reference>"
    signedInfo += "\n</ds:SignedInfo>"

    let keyInfo = ""
    keyInfo += '<ds:KeyInfo>'
    keyInfo += "\n<ds:X509Data>"
    keyInfo += "\n<ds:X509Certificate>\n"
    keyInfo += certificateX509
    keyInfo += "</ds:X509Certificate>"
    keyInfo += "\n</ds:X509Data>"
    keyInfo += "\n</ds:KeyInfo>"

    let signedProperties = ""
    signedProperties +=
        '\n<xades:SignedProperties \nId="' +
        uniqueId +
        "-signedprops" +
        '">'
    signedProperties += "\n<xades:SignedSignatureProperties>"
    signedProperties += "\n<xades:SigningTime>"
    signedProperties += generateISO8601DateWithTimezone()
    signedProperties += "</xades:SigningTime>"
    signedProperties += "\n<xades:SigningCertificate>"
    signedProperties += "\n<xades:Cert>"
    signedProperties += "\n<xades:CertDigest>"
    signedProperties +=
        '\n<ds:DigestMethod \nAlgorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>'
    signedProperties += "\n<ds:DigestValue>"
    signedProperties += base64_digest
    signedProperties += "</ds:DigestValue>"
    signedProperties += "\n</xades:CertDigest>"
    signedProperties += "\n<xades:IssuerSerial>"
    signedProperties += "\n<ds:X509IssuerName>"
    signedProperties += issuerName
    signedProperties += "</ds:X509IssuerName>"
    signedProperties += "\n<ds:X509SerialNumber>"
    signedProperties += certificateX509_serialNumber
    signedProperties += "</ds:X509SerialNumber>"
    signedProperties += "\n</xades:IssuerSerial>"
    signedProperties += "\n</xades:Cert>"
    signedProperties += "\n</xades:SigningCertificate>"
    signedProperties += "\n</xades:SignedSignatureProperties>"

    signedProperties += "\n<xades:SignedDataObjectProperties>"
    signedProperties +=
        '\n<xades:DataObjectFormat \nObjectReference="' +
        uniqueId +
        '-ref0">'
    signedProperties += "\n<xades:Description>"
    signedProperties += "FIRMA DIGITAL SRI"
    signedProperties += "</xades:Description>"
    signedProperties += "\n<xades:MimeType>"
    signedProperties += "text/xml"
    signedProperties += "</xades:MimeType>"
    signedProperties += "\n<xades:Encoding>"
    signedProperties += "UTF-8"
    signedProperties += "</xades:Encoding>"
    signedProperties += "\n</xades:DataObjectFormat>"
    signedProperties += "\n</xades:SignedDataObjectProperties>"
    signedProperties += "\n</xades:SignedProperties>"

    const canonicalizedSignedInfo = signedInfo.replace(
        "<ds:SignedInfo",
        "<ds:SignedInfo " + nameSpaces
    )

    const md = forge.md.sha256.create()
    md.update(canonicalizedSignedInfo, "utf8")

    let signature = Buffer.from(key.sign(md)).toString('base64')

    let xadesBes = ""
    xadesBes += "<ds:Signature " + 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' + ' Id="' + uniqueId + '">'
    xadesBes += "\n" + signedInfo

    xadesBes +=
        '\n<ds:SignatureValue Id="' + uniqueId + '-sigvalue">\n'

    xadesBes += signature
    xadesBes += "</ds:SignatureValue>"
    xadesBes += "\n" + keyInfo
    xadesBes +=
        '\n<ds:Object>';
    xadesBes +=
        '<xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" xmlns:xades141="http://uri.etsi.org/01903/v1.4.1#" Target="' + uniqueId + '">';
    xadesBes += signedProperties;

    xadesBes += "</xades:QualifyingProperties>";
    xadesBes += "</ds:Object>";
    xadesBes += "\n</ds:Signature>\n";

    return xml.replace(/(<[^<]+)$/, xadesBes + "$1");
} */

/* async function signXml(p12Password, invoiceXml) {

    const p12Asn1 = await getP12S3()

    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, p12Password)


    let privateKeyPem = null
    let publicCertPem = null
    let certChain = []

    p12.safeContents.forEach(safeContent => {
        safeContent.safeBags.forEach(safeBag => {
            // Buscar la clave privada
            if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
                const privateKey = safeBag.key
                privateKeyPem = forge.pki.privateKeyToPem(privateKey)
            }
            // Buscar el certificado público
            if (safeBag.type === forge.pki.oids.certBag) {
                const cert = safeBag.cert
                publicCertPem = forge.pki.certificateToPem(cert)
                certChain.push(cert)
            }
        })
    })

    if (privateKeyPem) {
        console.log('Private key extracted to privateKey.pem');
    } else {
        console.error('No private key found in the .p12 file.');
    }

    if (publicCertPem) {
        console.log('Public certificate extracted to publicCert.pem');
    } else {
        console.error('No public certificate found in the .p12 file.');
    }

    var sig = new SignedXml({
        privateKey: privateKeyPem,
        publicCert: publicCertPem,
        certChain: certChain 
    })

    sig.addReference({
        xpath: "//*[local-name(.)='factura']",
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        transforms: [
            "http://www.w3.org/2000/09/xmldsig#enveloped-signature" // Canonicalización XML
        ],
        id: 'xmldsig-539d6bdd-1388-47d9-9ffa-fe4266d6b0a3-ref0',
    })

    sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"

    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"

    sig.computeSignature(invoiceXml)

    return sig.getSignedXml()
} */

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

        const signedXml = await signXml2(business.pwP12, invoiceXml)

        const receptionResult = await validar_xml(signedXml)

        const authorizationResult = await documentAuthorization(
            json.infoTributaria.claveAcceso,
            process.env.SRI_AUTHORIZATION_URL
        )

        const mailOptions = {
            from: 'fruanocm2777@gmail.com',
            to: updatedSale.billData.email,
            subject: `Comprobante Electronico: ${invoice.factura.infoTributaria.claveAcceso}`,
            text: `Gracias por tu compra, puedes revisar tu comprobante electronico en el archivo: `,
        }

        try {
            // Send the email
            const info = await transporter.sendMail(mailOptions)
            console.log('Email sent: ', info.response)

            return NextResponse.json(
                {
                    msg: info.response
                },
                { status: 200 }
            )
        } catch (error) {
            console.error('Error sending email: ', error)
            return NextResponse.json(
                {
                    msg: error
                },
                { status: 200 }
            )
        }

        

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