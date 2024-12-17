import connectMongoDB from "@libs/mongodb"
import Sale from "@models/saleModel";
import { NextResponse } from "next/server"

export async function GET(request) {

    await connectMongoDB()

    const url = request.nextUrl

    const id = url.searchParams.get('id') || null

    if (!id) {
        return NextResponse.json(
            {
                message: 'Missing Info',
                error: true
            },
            {
                status: 404
            }
        )
    }


    const sale = await Sale.findById(id)

    if (!sale) {
        return NextResponse.json(
            { message: 'Sale not found' },
            { status: 404 })
    } else {
        return NextResponse.json(
            { data: sale },
            { status: 200, }
        )
    }
}
