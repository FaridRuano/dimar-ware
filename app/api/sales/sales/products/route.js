import connectMongoDB from "@libs/mongodb"
import { NextResponse } from "next/server"
import Product from "@models/productModel";

export async function GET(request) {

    await connectMongoDB()

    const url = request.nextUrl

    const cod = url.searchParams.get('cod') || null
    const name = url.searchParams.get('name') || null

    let products = []

    if(cod !== null){
        const codString = String(cod);
        products = await Product.find({
            $and: [
                { status: true }, 
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$cod" }, 
                            regex: codString, 
                            options: "i", 
                        },
                    },
                },
            ],
          }).limit(3)
      
          return NextResponse.json(
            {
                data: products
            },
            {
                status: 200
            }
        )
    }else if(name !== null){
        products = await Product.find({
            $and: [
                { status: true },
                { name: { $regex: name, $options: "i" } }, 
            ],
          }).limit(3);
      
          return NextResponse.json(
            {
                data: products
            },
            {
                status: 200
            }
        )
    }


    return NextResponse.json(
        {
            data: products
        },
        {
            status: 200
        }
    )
}
