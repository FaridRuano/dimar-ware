import connectMongoDB from "@libs/mongodb"
import Client from "@models/clientModel"
import Product from "@models/productModel"
import Sale from "@models/saleModel"
import moment from "@node_modules/moment-timezone"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {

        await connectMongoDB()

        const { month, year } = await request.json()

        if (month === null || year === null) {
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

        const startOfMonth = moment.tz(`${year}-${String(month + 1).padStart(2, '0')}-01`, "America/Guayaquil").startOf('month')
        const endOfMonth = moment.tz(`${year}-${String(month + 1).padStart(2, '0')}-01`, "America/Guayaquil").endOf('month')


        const sales = await Sale.find({
            updatedAt: {
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
        const productsAll = await Product.aggregate([
            {
                $match: {
                    'inventory.date': {
                        $gte: startOfMonth.toDate(),
                        $lte: endOfMonth.toDate()
                    }
                }
            },
            {
                $unwind: "$inventory"
            },
            {
                $group: {
                    _id: {
                        reason: "$inventory.reason",
                        amount: "$inventory.amount",
                        method: "$inventory.method",
                        newStock: "$inventory.newStock",
                        date: "$inventory.date",
                        productId: "$_id"
                    },
                    uniqueInventory: { $first: "$inventory" }
                }
            },
            {
                $replaceRoot: { newRoot: "$uniqueInventory" }
            },
            {
                $project: {
                    reason: 1,
                    amount: 1,
                    method: 1,
                    newStock: 1,
                    date: 1,
                    productId: "$_id.productId"
                }
            }
        ])

        const products = productsAll.filter(item => {
            const itemDate = moment(item.date, "YYYY-MM-DD");
            return itemDate.isBetween(startOfMonth, endOfMonth, null, '[]');
        })

        console.log(products)

        let totalEntries = 0
        let totalExits = 0

        products.forEach(product => {
            if (product.method === "Entrada") {
                console.log(product)
                totalEntries += Number(product.amount)
            } else if (product.method === "Salida") {
                totalExits += Math.abs(Number(product.amount))
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