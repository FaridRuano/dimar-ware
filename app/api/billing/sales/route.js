import connectMongoDB from "@libs/mongodb"
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