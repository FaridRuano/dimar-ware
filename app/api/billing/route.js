import connectMongoDB from "@libs/mongodb"
import Bill from "@models/billModel"
import Sale from "@models/saleModel"
import User from "@models/userModal"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {

        const url = request.nextUrl
        const user = url.searchParams.get('user') || null

        const userType = await User.findOne({ name: user }, 'rol')

        let query = {}

        if (userType.rol !== 'Administrador') {
            query['biller'] = user
        }

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        query.updatedAt = { $gte: startOfDay, $lt: endOfDay };

        await connectMongoDB()

        const totalE = await Sale.countDocuments({
            ...query,
            status: { $in: ['Completa', 'Por Entregar'] },
        })

        const sales = await Sale.find(query, '_id billData total')
            .sort({ updatedAt: -1 })
            .limit(5)

        const emision = await Sale.find(query)
            .select(' _id billData')
            .sort({ updatedAt: -1 })
            .limit(15)

        const data = {
            totalEmi: 0,
            sales: [],
            emision: []
        }

        data.totalEmi = totalE
        data.sales = sales
        data.emision = emision

        return NextResponse.json(
            {
                data
            },
            {
                status: 200
            }
        )

    } catch (e) {
        return NextResponse.json(
            {
                msg: 'Something went wrong!' + e
            },
            {
                status: 500
            }
        )
    }
}