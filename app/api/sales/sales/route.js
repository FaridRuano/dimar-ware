import connectMongoDB from "@libs/mongodb"
import Client from "@models/clientModel"
import Product from "@models/productModel"
import Sale from "@models/saleModel"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {

        await connectMongoDB()

        const url = request.nextUrl
        const page = parseInt(url.searchParams.get('page')) || 1
        const limit = parseInt(url.searchParams.get('limit')) || 10
        const type = parseInt(url.searchParams.get('type')) || 1
        const term = url.searchParams.get('term') || null
        const user = url.searchParams.get('user') || null

        const skip = (page - 1) * limit
        let query = {}

        if (term) {
            query['billData.name'] = { $regex: new RegExp(term, 'i') }
        }

        const totalSales = await Sale.countDocuments()

        const totalSalesPending = await Sale.countDocuments({ status: 'Pendiente' })

        const totalSalesToDeliver = await Sale.countDocuments({ status: 'Por Entregar' })

        const totalSalesComplete = await Sale.countDocuments({ status: 'Completa' })

        let sales

        let totalPages

        if (type === 1) {
            sales = await Sale.find(query, '_id cod billData.name total status')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec()

            totalPages = Math.ceil(totalSales / limit)

        } else if (type === 2) {
            sales = await Sale.find({ status: 'Pendiente' }, '_id cod billData.name total status')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec()

            totalPages = Math.ceil(totalSalesPending / limit)

        } else if (type === 3) {
            sales = await Sale.find({ status: 'Por Entregar' }, '_id cod billData.name total status')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec()

            totalPages = Math.ceil(totalSalesToDeliver / limit)

        } else if (type === 4) {
            sales = await Sale.find({ status: 'Completa' }, '_id cod billData.name total status')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec()

            totalPages = Math.ceil(totalSalesComplete / limit)
        }

        const formattedSales = sales.map(sale => ({
            _id: sale._id,
            cod: sale.cod,
            name: sale.billData.name,
            total: sale.total,
            status: sale.status,
        }))

        return NextResponse.json(
            {
                data: formattedSales,
                totalPages: totalPages,
                currentPage: page,
                totalSales,
                totalSalesPending,
                totalSalesToDeliver,
                totalSalesComplete
            },
            {
                status: 200
            }
        )
    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}

export async function POST(request) {
    try {

        await connectMongoDB()

        const { saler, dni, subtotal, iva, total, cart } = await request.json()

        if (!saler || !dni || !subtotal || !iva || !total || !cart) { return NextResponse.json({ message: 'Missing required fields', error: true }, { status: 400 }) }

        const client = await Client.findOne({ dni: dni })

        if (!client) {
            return NextResponse.json(
                {
                    message: 'Client not found',
                    error: true
                },
                {
                    status: 404
                }
            )
        }

        let cod = 0

        const highestCodPro = await Sale.find().sort({ cod: -1 }).limit(1)

        if (highestCodPro.length > 0) {
            // Si hay registros, toma el código más alto y suma 1
            cod = highestCodPro[0].cod + 1
        } else {
            // Si no hay registros, asigna el valor inicial de 1
            cod = 1
        }

        const status = 'Pendiente'

        const billData = {
            type: client.type,
            dni: client.dni,
            name: client.name,
            email: client.email,
            address: client.address,
            phone: client.phone,
        }

        const paymentMethod = ''

        const notes = ''

        await Sale.create({ cod, saler, biller: '', secuencial: 0, client: dni, subtotal, iva, total, status, paymentMethod, cart, billData, notes, codDoc: '', ptoEmi: '' })

        return NextResponse.json(
            {
                message: "Sale created"
            },
            {
                status: 200
            }
        )
    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}

export async function DELETE(request) {
    try {

        const { id } = await request.json()

        await connectMongoDB()

        const result = await Sale.findOneAndDelete({ _id: id })

        if (result) {
            return NextResponse.json(
                { message: "Sale deleted successfully" },
                { status: 200 })
        } else {
            return NextResponse.json(
                { message: "Sale not found" },
                { status: 404 })
        }
    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}

export async function PUT(request) {
    try {

        const { id } = await request.json()

        await connectMongoDB()

        await Sale.updateOne(
            { _id: id },
            {
                $set: {
                    status: 'Completa',
                },
            },
        )

        const updatedSale = await Sale.findOne({ _id: id })

        const { cart } = updatedSale

        for (const item of cart) {
            const { cod, amount } = item

            const product = await Product.findOne({ cod })

            if (!product) {
                return NextResponse.json(
                    { message: `Producto con código ${cod} no encontrado` },
                    { status: 404 }
                );
            }

            const newStock = product.stock - amount;

            await Product.updateOne(
                { cod },
                {
                    $set: { stock: newStock },
                    $push: {
                        inventory: {
                            reason: `Venta: ${updatedSale.cod}`,
                            amount: -amount,
                            method: 'Salida',
                            newStock,
                            date: new Date(), 
                        },
                    },
                },
            );
        }

        return NextResponse.json(
            {
                message: "Updated succesfully:"
            },
            {
                status: 200
            }
        )
    } catch (e) {
        return NextResponse.json(
            {
                message: "Something went wrong:", e
            },
            {
                status: 500
            }
        )
    }
}