import connectMongoDB from "@libs/mongodb"
import Product from "@models/productModel";
import { NextResponse } from "next/server"

export async function GET(request) {
    try {

        await connectMongoDB()

        const url = request.nextUrl

        /* Params */
        const page = parseInt(url.searchParams.get('page')) || 1
        const limit = parseInt(url.searchParams.get('limit')) || 10
        const term = url.searchParams.get('term') || null

        const skip = (page - 1) * limit

        let query = { }

        if(term !== null){
            query.name = { $regex: term, $options: 'i' };
        }

        const totalPro = await Product.countDocuments()

        let products

        let totalPages

        products = await Product.find(query, "-user -stock -createdAt -updatedAt -__v")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec()

        totalPages = Math.ceil(totalPro/limit)


        return NextResponse.json(
            { 
                data: products,
                totalPages: totalPages,
                currentPage: page,
                totalPro: totalPro
            },
            {
                status: 200,
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

export async function POST(request){
    try {
        const { cod, name, cat, und, price, user } = await request.json()

        await connectMongoDB()

        let newCod = cod

        if(cod === undefined) {
            const highestCodPro = await Product.find().sort({ cod: -1 }).limit(1)
            newCod = highestCodPro[0].cod + 1
        }

        const existingPro = await Product.findOne({ cod })


        if (existingPro) {
            const highestCodPro = await Product.find().sort({ cod: -1 }).limit(1)
            newCod = highestCodPro[0].cod + 1
        }


        const stock = 0

        const status = true

        await Product.create({ cod: newCod, name, cat, und, price, user, stock, status })

        return NextResponse.json(
            {
                message: "Product created"
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

export async function PUT(request) {
    try {
        const { action, id, cod, name, cat, und, price, user, status } = await request.json()

        await connectMongoDB()

        const existingPro = await Product.findById(id)

        if (!existingPro) {
            return NextResponse.json(
                {
                    message: "Product not found",
                    error: true,
                },
                {
                    status: 404,
                }
            );
        }

        let newCod = cod

        if (existingPro.cod === cod) {
            newCod = cod
        }else{
            const existingCod = await Product.findOne({ cod })

            if (existingCod) {
                const highestCodPro = await Product.find().sort({ cod: -1 }).limit(1)
                newCod = highestCodPro[0].cod + 1
            }

        }

        if(action === 'changepro'){
            existingPro.cod = newCod || existingPro.cod
            existingPro.name = name || existingPro.name
            existingPro.cat = cat || existingPro.cat
            existingPro.und = und || existingPro.und
            existingPro.price = price || existingPro.price
    
            await existingPro.save()
    
            return NextResponse.json(
                {
                    message: "Product updated successfully",
                    product: {
                        id: existingPro._id,
                        cod: existingPro.cod,
                        cat: existingPro.cat,
                        name: existingPro.name,
                        und: existingPro.und,
                        price: existingPro.price,
                    },
                },
                {
                    status: 200,
                }
            )
        }else if(action === 'changestatus'){
            existingPro.status = status !== undefined ? status : existingPro.status

            await existingPro.save()
    
            return NextResponse.json(
                {
                    message: "Product updated successfully",
                    product: {
                        id: existingPro._id,
                        cod: existingPro.cod,
                        cat: existingPro.cat,
                        name: existingPro.name,
                        und: existingPro.und,
                        price: existingPro.price,
                    },
                },
                {
                    status: 200,
                }
            )
        }

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

export async function DELETE(request){
    try{

        const { id } = await request.json()

        await connectMongoDB()

        const result = await Product.findOneAndDelete({ _id: id })
         
        if (result) {
            return NextResponse.json(
                { message: "Product deleted successfully" },
                { status: 200 })
        } else {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 })
        }
    }catch (error) {
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