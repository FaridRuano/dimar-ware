import Product from "@models/productModel"
import connectMongoDB from "@libs/mongodb"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {

        await connectMongoDB()

        const { reason, cart } = await request.json()

        for (const item of cart) {
            const { cod, amount, total } = item

            const product = await Product.findOne({ cod })

            if (!product) {
                return NextResponse.json(
                    { message: `Producto con código ${cod} no encontrado` },
                    { status: 404 }
                )
            }

            let method = 'Entrada'

            if (amount < 0) {
                method = 'Salida'
            }

            console.log(amount + ' ' + method)

            await Product.updateOne(
                { cod },
                {
                    $set: { stock: total },
                    $push: {
                        inventory: {
                            reason: reason,
                            amount: Number(amount),
                            method: method,
                            newStock: total,
                            date: new Date()
                        },
                    },
                },
            )
        }

        return NextResponse.json(
            {
                message: "Inventory updated succesfully!"
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