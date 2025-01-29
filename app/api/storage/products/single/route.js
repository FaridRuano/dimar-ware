import connectMongoDB from "@libs/mongodb"
import Inventory from "@models/inventoryModel";
import Product from "@models/productModel";
import { NextResponse } from "next/server"

export async function GET(request) {

    await connectMongoDB()

    const url = request.nextUrl

    const cod = url.searchParams.get('cod') || null
    const action = url.searchParams.get('action') || null

    if (!cod) {
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

        const product = await Product.findOne({cod: cod}).select('-user -inventory -createdAt -updatedAt -__v')

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

        const inventory = await Inventory.find({cod: cod})
        .sort({createdAt: -1})

        const totalInv = inventory.length

        const totalPages = Math.ceil(totalInv / limit)

        const data = inventory.slice(skip, skip + limit)

        return NextResponse.json(
            {
                data: data,
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

        const { cod, name, amount, reason, method, user } = await request.json()

        if (!cod || !amount || !reason || !user || !name) { return NextResponse.json({ message: 'Missing required fields', error: true }, { status: 400 }) }

        const product = await Product.findOne({cod: cod})

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

            const newInventory = new Inventory({
                cod, name, newStock, amount, reason, method: 'Entrada', user
            })

            await newInventory.save()

            product.stock = newStock
        } else {
            let newStock = parseFloat(product.stock) - parseFloat(amount);

            const newInventory = new Inventory({
                cod, name, newStock, amount: -amount, reason, method: 'Salida', user
            })
            await newInventory.save()

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