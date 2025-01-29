import mongoose, { Schema } from "mongoose";

const billSchema= new Schema({
    infoTributaria: {
        ambiente: { type: String, required: true },
        tipoEmision: { type: String, required: true },
        razonSocial: { type: String, required: true },
        nombreComercial: { type: String, required: true },
        ruc: { type: String, required: true },
        codDoc: { type: String, required: true },
        estab: { type: String, required: true },
        ptoEmi: { type: String, required: true },
        secuencial: { type: String, required: true },
        dirMatriz: { type: String, required: true },
        agenteRetencion: { type: String },
        contribuyenteRimpe: { type: String },
    },
    infoFactura: {
        fechaEmision: { type: String, required: true },
        dirEstablecimiento: { type: String },
        contribuyenteEspecial: { type: String },
        obligadoContabilidad: { type: String },
        comercioExterior: { type: String },
        incoTermFactura: { type: String },
        lugarIncoTerm: { type: String },
        paisOrigen: { type: String },
        puertoEmbarque: { type: String },
        puertoDestino: { type: String },
        paisDestino: { type: String },
        paisAdquisicion: { type: String },
        tipoIdentificacionComprador: { type: String },
        guiaRemision: { type: String },
        razonSocialComprador: { type: String },
        identificacionComprador: { type: String },
        direccionComprador: { type: String },
        totalSinImpuestos: { type: String },
        totalSubsidio: { type: String },
        incoTermTotalSinImpuestos: { type: String },
        totalDescuento: { type: String },
        codDocReembolso: { type: String },
        totalComprobantesReembolso: { type: String },
        totalBaseImponibleReembolso: { type: String },
        totalImpuestoReembolso: { type: String },
        totalConImpuestos: {
            totalImpuesto: [
                {
                    codigo: { type: String },
                    codigoPorcentaje: { type: String },
                    descuentoAdicional: { type: String },
                    baseImponible: { type: String },
                    tarifa: { type: String },
                    valor: { type: String },
                    valorDevolucionIva: { type: String },
                },
            ],
        },
        compensaciones: {
            compensacion: [
                {
                    codigo: { type: String },
                    tarifa: { type: String },
                    valor: { type: String },
                },
            ],
        },
        propina: { type: String },
        fleteInternacional: { type: String },
        seguroInternacional: { type: String },
        gastosAduaneros: { type: String },
        gastosTransporteOtros: { type: String },
        importeTotal: { type: String },
        moneda: { type: String },
        placa: { type: String },
        pagos: {
            pago: [
                {
                    formaPago: { type: String },
                    total: { type: String },
                    plazo: { type: String },
                    unidadTiempo: { type: String },
                },
            ],
        },
        valorRetIva: { type: String },
        valorRetRenta: { type: String },
    },
    detalles: {
        detalle: [
            {
                codigoPrincipal: { type: String },
                codigoAuxiliar: { type: String },
                descripcion: { type: String },
                unidadMedida: { type: String },
                cantidad: { type: String },
                precioUnitario: { type: String },
                precioSinSubsidio: { type: String },
                descuento: { type: String },
                precioTotalSinImpuesto: { type: String },
                detallesAdicionales: {
                    detAdicional: [
                        {
                            '@nombre': { type: String },
                            '@valor': { type: String },
                        },
                    ],
                },
                impuestos: {
                    impuesto: [
                        {
                            codigo: { type: String },
                            codigoPorcentaje: { type: String },
                            tarifa: { type: String },
                            baseImponible: { type: String },
                            valor: { type: String },
                        },
                    ],
                },
            },
        ],
    },
    reembolsos: {
        reembolsoDetalle: [
            {
                tipoIdentificacionProveedorReembolso: { type: String },
                identificacionProveedorReembolso: { type: String },
                codPaisPagoProveedorReembolso: { type: String },
                tipoProveedorReembolso: { type: String },
                codDocReembolso: { type: String },
                estabDocReembolso: { type: String },
                ptoEmiDocReembolso: { type: String },
                secuencialDocReembolso: { type: String },
                fechaEmisionDocReembolso: { type: String },
                numeroautorizacionDocReemb: { type: String },
                detalleImpuestos: {
                    detalleImpuesto: [
                        {
                            codigo: { type: String },
                            codigoPorcentaje: { type: String },
                            tarifa: { type: String },
                            baseImponibleReembolso: { type: String },
                            impuestoReembolso: { type: String },
                        },
                    ],
                },
                compensacionesReembolso: {
                    compensacionesReembolso: [
                        {
                            codigo: { type: String },
                            tarifa: { type: String },
                            valor: { type: String },
                        },
                    ],
                },
            },
        ],
    },
    retenciones: {
        retencion: [
            {
                codigo: { type: String },
                codigoPorcentaje: { type: String },
                tarifa: { type: String },
                valor: { type: String },
            },
        ],
    },
    infoSustitutivaGuiaRemision: {
        dirPartida: { type: String },
        dirDestinatario: { type: String },
        fechaIniTransporte: { type: String },
        fechaFinTransporte: { type: String },
        razonSocialTransportista: { type: String },
        tipoIdentificacionTransportista: { type: String },
        rucTransportista: { type: String },
        placa: { type: String },
        destinos: {
            destino: [
                {
                    motivoTraslado: { type: String },
                    docAduaneroUnico: { type: String },
                    codEstabDestino: { type: String },
                    ruta: { type: String },
                },
            ],
        },
    },
    otrosRubrosTerceros: {
        rubro: [
            {
                concepto: { type: String },
                total: { type: String },
            },
        ],
    },
    tipoNegociable: {
        correo: { type: String },
    },
    maquinaFiscal: {
        marca: { type: String },
        modelo: { type: String },
        serie: { type: String },
    },
    infoAdicional: {
        campoAdicional: [
            {
                '@nombre': { type: String },
                '#': { type: String },
            },
        ],
    }
},{
    timestamps: true
})

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema)

export default Bill
