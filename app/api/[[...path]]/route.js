import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Verify JWT token from cookie
function verifyToken(request) {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null
  
  const tokenMatch = cookie.match(/auth_token=([^;]+)/)
  if (!tokenMatch) return null
  
  try {
    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET)
    return decoded
  } catch (error) {
    return null
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // ==================== AUTH ROUTES ====================
    
    // Register - POST /api/auth/register
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, store_name, currency_symbol } = body
      
      if (!email || !password || !store_name) {
        return handleCORS(NextResponse.json(
          { error: 'Email, password y nombre de tienda son requeridos' },
          { status: 400 }
        ))
      }
      
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        ))
      }
      
      // Hash password
      const password_hash = await bcrypt.hash(password, 10)
      
      const user = {
        id: uuidv4(),
        email,
        password_hash,
        store_name,
        currency_symbol: currency_symbol || '$',
        created_at: new Date()
      }
      
      await db.collection('users').insertOne(user)
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      const response = NextResponse.json({
        message: 'Usuario registrado exitosamente',
        user: { id: user.id, email: user.email, store_name: user.store_name }
      })
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return handleCORS(response)
    }
    
    // Login - POST /api/auth/login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      
      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Email y password son requeridos' },
          { status: 400 }
        ))
      }
      
      const user = await db.collection('users').findOne({ email })
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        ))
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        return handleCORS(NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        ))
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      const response = NextResponse.json({
        message: 'Login exitoso',
        user: { id: user.id, email: user.email, store_name: user.store_name, currency_symbol: user.currency_symbol }
      })
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
      
      return handleCORS(response)
    }
    
    // Logout - POST /api/auth/logout
    if (route === '/auth/logout' && method === 'POST') {
      const response = NextResponse.json({ message: 'Logout exitoso' })
      response.cookies.delete('auth_token')
      return handleCORS(response)
    }
    
    // Get current user - GET /api/auth/me
    if (route === '/auth/me' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        ))
      }
      
      const user = await db.collection('users').findOne({ id: decoded.userId })
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          store_name: user.store_name,
          currency_symbol: user.currency_symbol
        }
      }))
    }
    
    // ==================== PROTECTED ROUTES ====================
    // All routes below require authentication
    
    const decoded = verifyToken(request)
    if (!decoded) {
      return handleCORS(NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      ))
    }
    
    const userId = decoded.userId
    
    // ==================== PRODUCTS ROUTES ====================
    
    // Get all products - GET /api/products
    if (route === '/products' && method === 'GET') {
      const url = new URL(request.url)
      const search = url.searchParams.get('search')
      const barcode = url.searchParams.get('barcode')
      
      let query = { user_id: userId }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (barcode) {
        query.barcode = barcode
      }
      
      const products = await db.collection('products')
        .find(query)
        .sort({ created_at: -1 })
        .toArray()
      
      const cleanedProducts = products.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedProducts))
    }
    
    // Create product - POST /api/products
    if (route === '/products' && method === 'POST') {
      const body = await request.json()
      const { barcode, name, cost_price, sale_price, stock_quantity, category } = body
      
      if (!name || !sale_price || stock_quantity === undefined) {
        return handleCORS(NextResponse.json(
          { error: 'Nombre, precio de venta y cantidad son requeridos' },
          { status: 400 }
        ))
      }
      
      const product = {
        id: uuidv4(),
        user_id: userId,
        barcode: barcode || '',
        name,
        cost_price: parseFloat(cost_price) || 0,
        sale_price: parseFloat(sale_price),
        stock_quantity: parseInt(stock_quantity),
        category: category || 'General',
        low_stock_alert: parseInt(stock_quantity) < 10,
        created_at: new Date()
      }
      
      await db.collection('products').insertOne(product)
      const { _id, ...cleanProduct } = product
      
      return handleCORS(NextResponse.json(cleanProduct))
    }
    
    // Update product - PUT /api/products/:id
    if (route.startsWith('/products/') && method === 'PUT') {
      const productId = path[1]
      const body = await request.json()
      
      const updateData = {
        ...body,
        cost_price: body.cost_price ? parseFloat(body.cost_price) : 0,
        sale_price: body.sale_price ? parseFloat(body.sale_price) : 0,
        stock_quantity: body.stock_quantity !== undefined ? parseInt(body.stock_quantity) : 0,
        low_stock_alert: (body.stock_quantity !== undefined ? parseInt(body.stock_quantity) : 0) < 10
      }
      
      const result = await db.collection('products').updateOne(
        { id: productId, user_id: userId },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json({ message: 'Producto actualizado' }))
    }
    
    // Delete product - DELETE /api/products/:id
    if (route.startsWith('/products/') && method === 'DELETE') {
      const productId = path[1]
      
      const result = await db.collection('products').deleteOne({
        id: productId,
        user_id: userId
      })
      
      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json({ message: 'Producto eliminado' }))
    }
    
    // ==================== SALES ROUTES ====================
    
    // Create sale - POST /api/sales
    if (route === '/sales' && method === 'POST') {
      const body = await request.json()
      const { items, payment_method, amount_received } = body
      
      if (!items || items.length === 0) {
        return handleCORS(NextResponse.json(
          { error: 'No hay items en la venta' },
          { status: 400 }
        ))
      }
      
      // Validate stock and calculate totals
      let total_amount = 0
      let total_cost = 0
      const saleItems = []
      
      for (const item of items) {
        const product = await db.collection('products').findOne({
          id: item.product_id,
          user_id: userId
        })
        
        if (!product) {
          return handleCORS(NextResponse.json(
            { error: `Producto ${item.product_id} no encontrado` },
            { status: 404 }
          ))
        }
        
        if (product.stock_quantity < item.quantity) {
          return handleCORS(NextResponse.json(
            { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}` },
            { status: 400 }
          ))
        }
        
        const itemTotal = product.sale_price * item.quantity
        const itemCost = product.cost_price * item.quantity
        
        total_amount += itemTotal
        total_cost += itemCost
        
        saleItems.push({
          product_id: product.id,
          product_name: product.name,
          quantity: item.quantity,
          price_at_sale: product.sale_price,
          cost_at_sale: product.cost_price
        })
        
        // Update stock
        await db.collection('products').updateOne(
          { id: product.id, user_id: userId },
          { 
            $inc: { stock_quantity: -item.quantity },
            $set: { low_stock_alert: (product.stock_quantity - item.quantity) < 10 }
          }
        )
      }
      
      const sale = {
        id: uuidv4(),
        user_id: userId,
        total_amount,
        profit: total_amount - total_cost,
        payment_method: payment_method || 'cash',
        amount_received: amount_received || total_amount,
        change_given: (amount_received || total_amount) - total_amount,
        items: saleItems,
        date: new Date()
      }
      
      await db.collection('sales').insertOne(sale)
      const { _id, ...cleanSale } = sale
      
      return handleCORS(NextResponse.json(cleanSale))
    }
    
    // Get all sales - GET /api/sales
    if (route === '/sales' && method === 'GET') {
      const url = new URL(request.url)
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')
      
      let query = { user_id: userId }
      
      if (startDate || endDate) {
        query.date = {}
        if (startDate) query.date.$gte = new Date(startDate)
        if (endDate) query.date.$lte = new Date(endDate)
      }
      
      const sales = await db.collection('sales')
        .find(query)
        .sort({ date: -1 })
        .limit(1000)
        .toArray()
      
      const cleanedSales = sales.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedSales))
    }
    
    // ==================== DASHBOARD ROUTES ====================
    
    // Get dashboard stats - GET /api/dashboard/stats
    if (route === '/dashboard/stats' && method === 'GET') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Sales today
      const salesToday = await db.collection('sales')
        .find({
          user_id: userId,
          date: { $gte: today }
        })
        .toArray()
      
      const todayRevenue = salesToday.reduce((sum, sale) => sum + sale.total_amount, 0)
      const todayProfit = salesToday.reduce((sum, sale) => sum + sale.profit, 0)
      const todaySalesCount = salesToday.length
      
      // Low stock products
      const lowStockProducts = await db.collection('products')
        .find({
          user_id: userId,
          stock_quantity: { $lt: 10 }
        })
        .toArray()
      
      // Total products
      const totalProducts = await db.collection('products').countDocuments({ user_id: userId })
      
      // This month stats
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const salesThisMonth = await db.collection('sales')
        .find({
          user_id: userId,
          date: { $gte: monthStart }
        })
        .toArray()
      
      const monthRevenue = salesThisMonth.reduce((sum, sale) => sum + sale.total_amount, 0)
      const monthProfit = salesThisMonth.reduce((sum, sale) => sum + sale.profit, 0)
      
      return handleCORS(NextResponse.json({
        today: {
          revenue: todayRevenue,
          profit: todayProfit,
          sales_count: todaySalesCount
        },
        month: {
          revenue: monthRevenue,
          profit: monthProfit
        },
        inventory: {
          total_products: totalProducts,
          low_stock_count: lowStockProducts.length,
          low_stock_products: lowStockProducts.map(({ _id, ...rest }) => rest)
        }
      }))
    }
    
    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute