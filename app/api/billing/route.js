import connectMongoDB from "@libs/mongodb"
import Bill from "@models/billModel"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {

        const data = {
            totalEmi: 0,
            sales: [],
            emision: []
        }

        await connectMongoDB()

        const totalE = await Bill.countDocuments()

        const sales = await Bill.find()
            .select(' infoFactura.razonSocialComprador infoFactura.importeTotal')
            .sort({ 'infoFactura.fechaEmision': -1 })
            .limit(5)

        const emision = await Bill.find()
        .select(' infoFactura.razonSocialComprador')
        .sort({'infoFactura.fechaEmision': -1})
        .limit(15)

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