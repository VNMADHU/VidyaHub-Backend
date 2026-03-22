import prisma from '../utils/prisma.js'

// GET /assets
export const listAssets = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { category, status, location, search } = req.query

    const where = { schoolId }
    if (category) where.category = category
    if (status)   where.status   = status
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { name:      { contains: search, mode: 'insensitive' } },
        { assetCode: { contains: search, mode: 'insensitive' } },
        { vendor:    { contains: search, mode: 'insensitive' } },
      ]
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    res.json(assets)
  } catch (err) {
    console.error('listAssets error:', err)
    res.status(500).json({ message: 'Failed to fetch assets' })
  }
}

// POST /assets
export const createAsset = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const {
      name, assetCode, category, quantity, unit,
      condition, location, purchaseDate, purchasePrice,
      vendor, warrantyExpiry, invoiceNo, description, status,
    } = req.body

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' })
    }

    const asset = await prisma.asset.create({
      data: {
        schoolId,
        name,
        assetCode:     assetCode     || null,
        category,
        quantity:      quantity      != null ? parseInt(quantity) : 1,
        unit:          unit          || null,
        condition:     condition     || 'good',
        location:      location      || null,
        purchaseDate:  purchaseDate  ? new Date(purchaseDate)  : null,
        purchasePrice: purchasePrice != null ? parseFloat(purchasePrice) : null,
        vendor:        vendor        || null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        invoiceNo:     invoiceNo     || null,
        description:   description   || null,
        status:        status        || 'active',
      },
    })

    res.status(201).json(asset)
  } catch (err) {
    console.error('createAsset error:', err)
    res.status(500).json({ message: 'Failed to create asset' })
  }
}

// PATCH /assets/:id
export const updateAsset = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { id } = req.params

    const existing = await prisma.asset.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return res.status(404).json({ message: 'Asset not found' })
    if (existing.schoolId !== schoolId) return res.status(403).json({ message: 'Access denied' })

    const {
      name, assetCode, category, quantity, unit,
      condition, location, purchaseDate, purchasePrice,
      vendor, warrantyExpiry, invoiceNo, description, status,
    } = req.body

    const updated = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        ...(name          !== undefined && { name }),
        ...(assetCode     !== undefined && { assetCode }),
        ...(category      !== undefined && { category }),
        ...(quantity      !== undefined && { quantity: parseInt(quantity) }),
        ...(unit          !== undefined && { unit }),
        ...(condition     !== undefined && { condition }),
        ...(location      !== undefined && { location }),
        ...(purchaseDate  !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(purchasePrice !== undefined && { purchasePrice: purchasePrice != null ? parseFloat(purchasePrice) : null }),
        ...(vendor        !== undefined && { vendor }),
        ...(warrantyExpiry !== undefined && { warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null }),
        ...(invoiceNo     !== undefined && { invoiceNo }),
        ...(description   !== undefined && { description }),
        ...(status        !== undefined && { status }),
      },
    })

    res.json(updated)
  } catch (err) {
    console.error('updateAsset error:', err)
    res.status(500).json({ message: 'Failed to update asset' })
  }
}

// DELETE /assets/:id
export const deleteAsset = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { id } = req.params

    const existing = await prisma.asset.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return res.status(404).json({ message: 'Asset not found' })
    if (existing.schoolId !== schoolId) return res.status(403).json({ message: 'Access denied' })

    await prisma.asset.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Asset deleted' })
  } catch (err) {
    console.error('deleteAsset error:', err)
    res.status(500).json({ message: 'Failed to delete asset' })
  }
}

// GET /assets/summary  — category-wise totals
export const assetSummary = async (req, res) => {
  try {
    const schoolId = req.user.schoolId

    const assets = await prisma.asset.findMany({
      where: { schoolId, status: { not: 'disposed' } },
      select: { category: true, quantity: true, purchasePrice: true },
    })

    const summary = {}
    let totalItems = 0
    let totalValue = 0

    for (const a of assets) {
      if (!summary[a.category]) summary[a.category] = { count: 0, quantity: 0, value: 0 }
      summary[a.category].count    += 1
      summary[a.category].quantity += a.quantity
      summary[a.category].value    += (a.purchasePrice || 0) * a.quantity
      totalItems += a.quantity
      totalValue += (a.purchasePrice || 0) * a.quantity
    }

    res.json({ categories: summary, totalItems, totalValue })
  } catch (err) {
    console.error('assetSummary error:', err)
    res.status(500).json({ message: 'Failed to fetch summary' })
  }
}
