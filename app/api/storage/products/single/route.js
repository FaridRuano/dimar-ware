import connectMongoDB from "@libs/mongodb"
import Product from "@models/productModel";
import { NextResponse } from "next/server"

export async function GET(request) {

    await connectMongoDB()

    const url = request.nextUrl

    const id = url.searchParams.get('id') || null
    const action = url.searchParams.get('action') || null

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

    if (action === 'one') {

        const product = await Product.findById(id).select('-user -inventory -createdAt -updatedAt -__v')

        if (!product) {
            return NextResponse.json(
                { message: 'Product not found' },
                { status: 404 })
        } else {
            return NextResponse.json({ data: product }, { status: 200, })
        }
    } else {

        const page = parseInt(url.searchParams.get('page')) || 1
        const limit = parseInt(url.searchParams.get('limit')) || 10
        const skip = (page - 1) * limit

        const product = await Product.findById(id).select('+inventory')

        if (!product) {
            return NextResponse.json(
                { message: 'Product not found' },
                { status: 404 }
            )
        }

        product.inventory.sort((a, b) => new Date(b.date) - new Date(a.date))

        const totalInv = product.inventory.length
        const totalPages = Math.ceil(totalInv / limit)

        const inventory = product.inventory.slice(skip, skip + limit)

        return NextResponse.json(
            {
                data: inventory,
                totalPages: totalPages,
                currentPage: page,
            },
            { status: 200 }
        )


    }

}

export async function POST(request) {
    try {

        await connectMongoDB()

        const { id, amount, reason, method } = await request.json()

        if (!id || !amount || !reason) { return NextResponse.json({ message: 'Missing required fields', error: true }, { status: 400 }) }

        const product = await Product.findById(id)

        if (!product) {
            return NextResponse.json(
                {
                    message: 'Product not found',
                    error: true
                },
                {
                    status: 404
                }
            )
        }

        if (method === 'add') {
            let newStock = parseFloat(product.stock) + parseFloat(amount);

            product.inventory.push({
                reason,
                amount,
                method: 'Entrada',
                newStock,
                date: new Date().toISOString() // Fecha de registro en formato ISO
            });

            product.stock = newStock;
        } else {
            let newStock = parseFloat(product.stock) - parseFloat(amount);

            product.inventory.push({
                reason,
                amount: -amount,
                method: 'Salida',
                newStock,
                date: new Date().toISOString() // Fecha de registro en formato ISO
            });

            product.stock = newStock;
        }


        await product.save()

        return NextResponse.json({ message: 'Inventory updated successfully', error: false }, { status: 200 })

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