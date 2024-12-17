import connectMongoDB from "@libs/mongodb"
import Client from "@models/clientModel"
import Product from "@models/productModel"
import Sale from "@models/saleModel"
import moment from "@node_modules/moment-timezone"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {

        await connectMongoDB()

        const { month } = await request.json()

        if (month === null) {
            return NextResponse.json(
                {
                    data: {
                        totalSales: 0
                    }
                },
                {
                    status: 200
                }
            )
        }

        /* VENTAS */

        const year = new Date().getFullYear()

        const startOfMonth = moment.tz(`${year}-${month + 1}-01`, "America/Guayaquil").startOf('month')
        const endOfMonth = moment.tz(`${year}-${month + 1}-01`, "America/Guayaquil").endOf('month')

        const sales = await Sale.find({
            createdAt: {
                $gte: startOfMonth.toDate(),
                $lte: endOfMonth.toDate(),
            },
            status: 'Completa',
        }).select('total cart saler createdAt')

        let totalSales = 0

        const productSalesCount = []

        const sellerSales = {}

        sales.forEach(sale => {
            totalSales += sale.total

            if (sale.saler) {
                if (!sellerSales[sale.saler]) {
                    sellerSales[sale.saler] = 0
                }
                sellerSales[sale.saler] += sale.total
            }

            sale.cart.forEach(item => {
                const productCode = item.cod
                const productName = item.name
                const quantity = Number(item.amount)

                const existingProduct = productSalesCount.find(product => product.cod === productCode)

                if (existingProduct) {
                    existingProduct.quantity += quantity
                } else {
                    productSalesCount.push({
                        cod: productCode,
                        name: productName,
                        quantity: quantity
                    })
                }
            })
        })

        const sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

        const top5Products = sortedProducts.slice(0, 5)

        const topSellers = Object.entries(sellerSales)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3)

        /* ENTRADAS Y SALIDAS */

        const products = await Product.find({
            'inventory.date': {
                $gte: startOfMonth.toDate(),
                $lte: endOfMonth.toDate(),
            }
        }).select('inventory')

        let totalEntries = 0
        let totalExits = 0

        products.forEach(product => {
            if (product.inventory && product.inventory.length > 0) {
                product.inventory.forEach(record => {
                    if (record.method === "Entrada") {
                        totalEntries += Number(record.amount)
                    } else if (record.method === "Salida") {
                        totalExits += Math.abs(Number(record.amount))
                    }
                })
            }
        })

        /* TOTALES */

        const totalClients = await Client.countDocuments()

        const totalProducts = await Product.countDocuments()

        const productsStock = await Product.find().select("stock")

        const totalStock = productsStock.reduce((sum, product) => {
            if (product.stock > 0) {
                return sum + product.stock;
            }
            return sum;
        }, 0)

        const data = {
            totalSales: totalSales.toFixed(2),
            top5Products,
            totalExits,
            totalEntries,
            topSellers,
            totalClients,
            totalProducts,
            totalStock
        }

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
                message: "Something went wrong: " + e
            },
            {
                status: 500
            }
        )
    }
}