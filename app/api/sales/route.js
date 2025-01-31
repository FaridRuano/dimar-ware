import connectMongoDB from "@libs/mongodb"
import Client from "@models/clientModel"
import Sale from "@models/saleModel"
import User from "@models/userModal"
import { NextResponse } from "next/server"

export async function GET(request) {

    const url = request.nextUrl
    const user = url.searchParams.get('user') || null

    const userType = await User.findOne({ name: user }, 'rol')

    let query = {}

    if (userType.rol !== 'Administrador') {
        query['saler'] = user
    }

    await connectMongoDB()

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    query.updatedAt = { $gte: startOfDay, $lt: endOfDay };

    const sales = await Sale.find(query, "_id cod billData.name total updatedAt")
        .sort({ updatedAt: -1 })
        .limit(15)

    if (!sales || sales.length === 0) {
        return NextResponse.json(
            {
                latestSales
            },
            { status: 200 }
        )
    }

    const latestSales = sales.map(sale => ({
        _id: sale._id,
        cod: sale.cod,
        name: sale.billData.name,
        total: sale.total,
        date: sale.updatedAt,
    }))

    const totalSales = await Sale.aggregate([
        {
            $match: {
                updatedAt: { $gte: startOfDay, $lte: endOfDay }, // Ventas de hoy
            },
        },
        {
            $group: {
                _id: null, // No agrupamos por ningún campo
                total: { $sum: "$total" }, // Sumar el campo 'total'
            },
        },
    ])

    const total = totalSales.length > 0 ? totalSales[0].total : 0

    const clients = await Client.find({}, "_id name")
        .sort({ updatedAt: -1 })
        .limit(4)

    return NextResponse.json(
        {
            latestSales,
            totalSales: total,
            latestClients: clients
        },
        { status: 200 }
    )
}