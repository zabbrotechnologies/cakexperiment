import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Search,
  X,
  UploadCloud,
  FolderTree,
  Boxes,
  Eye,
  EyeOff
} from 'lucide-react';
import { ecommerceApi, optimizeAndUploadProductImage } from '../../services/ecommerceApi';
import type { PhysicalProduct, ProductCategory, ProductVariant } from '../../types';
import { ConfirmActionModal } from '../../components/admin/ConfirmActionModal';

interface VariantDraft {
  id?: string;
  variantName: string;
  size: string;
  colour: string;
  colourHex: string;
  sku: string;
  priceAdjustment: number;
  stock: number;
  image: string;
  isActive: boolean;
}

export const AdminProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'inventory'>('products');
  const [products, setProducts] = useState<PhysicalProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<PhysicalProduct | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ProductCategory | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Product Editor Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(999);
  const [compareAtPrice, setCompareAtPrice] = useState<string>('1299');
  const [baseStock, setBaseStock] = useState(15);
  const [badge, setBadge] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [featured, setFeatured] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  // Stock Adjust Modal
  const [stockModalProduct, setStockModalProduct] = useState<PhysicalProduct | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [savingStock, setSavingStock] = useState(false);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ProductCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [prodData, catList] = await Promise.all([
        ecommerceApi.adminGetProducts(),
        ecommerceApi.adminGetCategories()
      ]);
      setProducts(prodData.products || []);
      setMovements(prodData.movements || []);
      setCategories(catList || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load products from Neon DB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProductModal = (prod?: PhysicalProduct) => {
    setErrorMsg(null);
    if (prod) {
      setEditingId(prod.id);
      setName(prod.name);
      setSlug(prod.slug);
      setCategoryId(prod.categoryId || categories[0]?.id || '');
      setShortDescription(prod.shortDescription || '');
      setDescription(prod.description || '');
      setBasePrice(prod.basePrice);
      setCompareAtPrice(prod.compareAtPrice ? String(prod.compareAtPrice) : '');
      setBaseStock(prod.stock || 0);
      setBadge(prod.badge || '');
      setProductInfo(prod.productInfo || '');
      setDeliveryInfo(prod.deliveryInfo || '');
      setFeatured(prod.featured);
      setIsExclusive(prod.isExclusive);
      setIsActive(prod.isActive);
      setImages(prod.images || []);
      setVariants(
        (prod.variants || []).map(v => ({
          id: v.id,
          variantName: v.variantName,
          size: v.size || '',
          colour: v.colour || '',
          colourHex: v.colourHex || '#A95768',
          sku: v.sku || '',
          priceAdjustment: v.priceAdjustment || 0,
          stock: v.stock || 0,
          image: v.image || '',
          isActive: v.isActive
        }))
      );
    } else {
      setEditingId(null);
      setName('');
      setSlug('');
      setCategoryId(categories[0]?.id || '');
      setShortDescription('');
      setDescription('');
      setBasePrice(999);
      setCompareAtPrice('1299');
      setBaseStock(20);
      setBadge('Fresh Edition');
      setProductInfo('Handcrafted in small batches at Cakexperiment Studio.');
      setDeliveryInfo('Standard & Express Delivery available across India.');
      setFeatured(true);
      setIsExclusive(false);
      setIsActive(true);
      setImages(['/images/hero-cake.png']);
      setVariants([]);
    }
    setModalOpen(true);
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg(null);
    try {
      for (const file of Array.from(files)) {
        const res = await optimizeAndUploadProductImage(file);
        setImages(prev => [...prev, res.url]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image optimization/upload failed.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddVariantRow = () => {
    setVariants(prev => [
      ...prev,
      {
        variantName: '',
        size: 'Standard',
        colour: 'Rose Blush',
        colourHex: '#A95768',
        sku: `CAK-${Date.now().toString().slice(-4)}`,
        priceAdjustment: 0,
        stock: 10,
        image: images[0] || '',
        isActive: true
      }
    ]);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      await ecommerceApi.adminSaveProduct({
        ...(editingId ? { id: editingId } : {}),
        name: name.trim(),
        slug: slug.trim() || undefined,
        categoryId: categoryId || null,
        shortDescription,
        description,
        basePrice: Number(basePrice),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        stock: Number(baseStock),
        badge: badge.trim() || null,
        productInfo: productInfo.trim() || null,
        deliveryInfo: deliveryInfo.trim() || null,
        featured,
        isExclusive,
        isActive,
        images,
        variants: variants.map(v => ({
          ...v,
          variantName: v.variantName.trim() || `${v.colour} / ${v.size}`.replace(/^ \/ | \/ $/g, ''),
          priceAdjustment: Number(v.priceAdjustment || 0),
          stock: Math.max(0, Number(v.stock || 0))
        }))
      });

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pid: string) => {
    try {
      await ecommerceApi.adminToggleProductActive(pid);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteProduct = (prod: PhysicalProduct) => {
    setErrorMsg(null);
    setDeleteProductTarget(prod);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setDeletingItem(true);
    setErrorMsg(null);
    try {
      await ecommerceApi.adminDeleteProduct(deleteProductTarget.id);
      const deletedName = deleteProductTarget.name;
      setDeleteProductTarget(null);
      await loadData();
      setSuccessMsg(`Deleted "${deletedName}" permanently.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setDeletingItem(false);
    }
  };

  const confirmDeleteProductCategory = async () => {
    if (!deleteCategoryTarget) return;
    setDeletingItem(true);
    setErrorMsg(null);
    try {
      await ecommerceApi.adminDeleteCategory(deleteCategoryTarget.id);
      const deletedName = deleteCategoryTarget.name;
      setDeleteCategoryTarget(null);
      await loadData();
      setSuccessMsg(`Deleted product category "${deletedName}".`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete product category.');
    } finally {
      setDeletingItem(false);
    }
  };

  const openStockModal = (prod: PhysicalProduct) => {
    setStockModalProduct(prod);
    const drafts: Record<string, number> = { base: prod.stock };
    prod.variants.forEach(v => {
      drafts[v.id] = v.stock;
    });
    setStockDrafts(drafts);
  };

  const handleSaveStock = async () => {
    if (!stockModalProduct) return;
    setSavingStock(true);
    try {
      if (stockModalProduct.variants.length > 0) {
        for (const v of stockModalProduct.variants) {
          await ecommerceApi.adminAdjustStock(stockModalProduct.id, stockDrafts[v.id] ?? v.stock, v.id);
        }
      } else {
        await ecommerceApi.adminAdjustStock(stockModalProduct.id, stockDrafts.base ?? 0);
      }
      setStockModalProduct(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSavingStock(false);
    }
  };

  const openCategoryModal = (cat?: ProductCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatSlug(cat.slug);
      setCatDesc(cat.description);
      setCatImage(cat.image);
    } else {
      setEditingCat(null);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setCatImage('');
    }
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await ecommerceApi.adminSaveCategory({
        ...(editingCat ? { id: editingCat.id } : {}),
        name: catName.trim(),
        slug: catSlug.trim() || undefined,
        description: catDesc.trim(),
        image: catImage.trim(),
        isActive: true
      });
      setCatModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600, margin: 0 }}>
            Physical Products, Variants & Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
            Manage physical shop items, sizes, colours, variant pricing, Neon Object Storage images, and stock levels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'categories' ? (
            <button type="button" onClick={() => openCategoryModal()} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Add Product Category
            </button>
          ) : (
            <button type="button" onClick={() => openProductModal()} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Add Physical Product
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.9rem 1.2rem', borderRadius: '12px', border: '1px solid #C8E6C9', fontSize: '0.88rem' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && !deleteProductTarget && !deleteCategoryTarget && (
        <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.9rem 1.2rem', borderRadius: '12px', border: '1px solid #FFCDD2', fontSize: '0.88rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #EEDCE0', flexWrap: 'wrap' }}>
        {[
          { key: 'products', label: `Products (${products.length})`, icon: <Package size={16} /> },
          { key: 'categories', label: `Categories (${categories.length})`, icon: <FolderTree size={16} /> },
          { key: 'inventory', label: 'Inventory Movements', icon: <Boxes size={16} /> }
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '0.7rem 1.25rem',
              border: 'none',
              background: 'none',
              fontWeight: 700,
              fontSize: '0.94rem',
              color: activeTab === t.key ? 'var(--color-berry)' : 'var(--color-plum)',
              borderBottom: activeTab === t.key ? '3px solid var(--color-berry)' : '3px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '0.9rem 1rem', border: '1px solid var(--border-subtle)', maxWidth: '380px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search products or categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem' }}>Product</th>
                    <th style={{ padding: '1rem' }}>Category</th>
                    <th style={{ padding: '1rem' }}>Base Price</th>
                    <th style={{ padding: '1rem' }}>Variants</th>
                    <th style={{ padding: '1rem' }}>Total Stock</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading physical products...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No physical products found.</td></tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <img src={p.images?.[0] || '/images/hero-cake.png'} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{p.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.categoryName || 'Uncategorized'}</td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                          ₹{p.basePrice.toLocaleString('en-IN')}
                          {p.compareAtPrice && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textDecoration: 'line-through', marginLeft: '5px' }}>₹{p.compareAtPrice}</span>}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="badge badge-blush">{p.variants?.length || 0} variants</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => openStockModal(p)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: p.stock <= 0 ? '#FFEBEE' : p.stock <= 10 ? '#FFF3E0' : '#E8F5E9',
                              color: p.stock <= 0 ? '#C62828' : p.stock <= 10 ? '#E65100' : '#2E7D32',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            {p.stock} units (Edit)
                          </button>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.28rem 0.7rem',
                              borderRadius: '999px',
                              border: 'none',
                              backgroundColor: p.isActive ? '#E8F5E9' : '#ECECEC',
                              color: p.isActive ? '#2E7D32' : '#666',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              cursor: 'pointer'
                            }}
                          >
                            {p.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                            {p.isActive ? 'Published' : 'Unpublished'}
                          </button>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button type="button" onClick={() => openProductModal(p)} className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteProduct(p)} className="btn btn-outline btn-sm" style={{ borderColor: '#FFCDD2', color: '#C62828' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.05rem', color: 'var(--color-plum)' }}>{cat.name}</strong>
                <span className="badge badge-blush">{(cat as any).product_count ?? 0} products</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>{cat.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: 'auto' }}>
                <button type="button" onClick={() => openCategoryModal(cat)} className="btn btn-secondary btn-sm">
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setDeleteCategoryTarget(cat);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#FFCDD2', color: '#C62828' }}
                  title={`Delete ${cat.name}`}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: INVENTORY MOVEMENTS */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.9rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Product ID</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Variant ID</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Change</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Stock Shift</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inventory movements recorded yet.</td></tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString()}</td>
                      <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace' }}>{m.product_id}</td>
                      <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace' }}>{m.variant_id || '—'}</td>
                      <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{m.reason}</td>
                      <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: m.change_amount < 0 ? '#C62828' : '#2E7D32' }}>
                        {m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount}
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>{m.previous_stock} → <strong>{m.new_stock}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT EDITOR PORTAL MODAL */}
      {modalOpen &&
        createPortal(
          <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
                <h3 style={{ margin: 0, color: 'var(--color-plum)' }}>
                  {editingId ? 'Edit Physical Product' : 'Create Physical Product'}
                </h3>
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Product Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Category</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-field">
                      <option value="">Uncategorized</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Base Price (₹) *</label>
                    <input type="number" required min={1} value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Compare-At Price (₹)</label>
                    <input type="number" min={0} value={compareAtPrice} onChange={e => setCompareAtPrice(e.target.value)} className="input-field" />
                  </div>
                  {variants.length === 0 && (
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Stock Quantity *</label>
                      <input type="number" min={0} value={baseStock} onChange={e => setBaseStock(Number(e.target.value))} className="input-field" />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Badge Label</label>
                    <input type="text" placeholder="e.g. Bestseller" value={badge} onChange={e => setBadge(e.target.value)} className="input-field" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Short Description</label>
                  <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)} className="input-field" />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Full Description</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="input-field" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Product Information</label>
                    <input type="text" value={productInfo} onChange={e => setProductInfo(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Delivery Information</label>
                    <input type="text" value={deliveryInfo} onChange={e => setDeliveryInfo(e.target.value)} className="input-field" />
                  </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Published (Active)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                    <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} /> Featured Product
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                    <input type="checkbox" checked={isExclusive} onChange={e => setIsExclusive(e.target.checked)} /> Exclusive Homepage Showcase
                  </label>
                </div>

                {/* Multi-Image Upload with Client Optimization */}
                <div style={{ backgroundColor: 'var(--color-cream)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-plum)' }}>Product Gallery Images (Optimized before S3 Upload)</strong>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <UploadCloud size={15} />
                      <span>{uploadingImage ? 'Optimizing & Uploading...' : 'Upload Image(s)'}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={handleUploadFiles} />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                    {images.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.65)', color: '#FFF', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Or paste image URL..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} className="input-field" style={{ flex: 1 }} />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setImages(prev => [...prev, newImageUrl.trim()]);
                          setNewImageUrl('');
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Variants Editor */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-plum)' }}>Product Variants (Sizes, Colours, Variant Prices & Stock)</strong>
                    <button type="button" onClick={handleAddVariantRow} className="btn btn-secondary btn-sm">
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      No variants added — product will use Base Price and Base Stock.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {variants.map((v, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 0.6fr 0.8fr 0.7fr 1.2fr auto', gap: '0.45rem', alignItems: 'center', backgroundColor: '#FAF7F7', padding: '0.6rem', borderRadius: '8px' }}>
                          <input placeholder="Size (e.g. 1 Kg / M)" value={v.size} onChange={e => { const next = [...variants]; next[idx].size = e.target.value; setVariants(next); }} className="input-field" style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} />
                          <input placeholder="Colour" value={v.colour} onChange={e => { const next = [...variants]; next[idx].colour = e.target.value; setVariants(next); }} className="input-field" style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} />
                          <input type="color" value={v.colourHex || '#A95768'} onChange={e => { const next = [...variants]; next[idx].colourHex = e.target.value; setVariants(next); }} style={{ width: '36px', height: '32px', border: 'none', cursor: 'pointer' }} title="Colour Swatch" />
                          <input type="number" placeholder="+₹ Price" value={v.priceAdjustment} onChange={e => { const next = [...variants]; next[idx].priceAdjustment = Number(e.target.value); setVariants(next); }} className="input-field" style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} title="Price adjustment (₹)" />
                          <input type="number" min={0} placeholder="Stock" value={v.stock} onChange={e => { const next = [...variants]; next[idx].stock = Number(e.target.value); setVariants(next); }} className="input-field" style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} title="Variant stock" />
                          <select value={v.image} onChange={e => { const next = [...variants]; next[idx].image = e.target.value; setVariants(next); }} className="input-field" style={{ fontSize: '0.78rem', padding: '0.35rem 0.4rem' }}>
                            <option value="">Default image</option>
                            {images.map((im, iIdx) => <option key={iIdx} value={im}>Image #{iIdx + 1}</option>)}
                          </select>
                          <button type="button" onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving || uploadingImage} className="btn btn-primary">
                    {saving ? 'Saving to Neon DB...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* QUICK STOCK MODAL */}
      {stockModalProduct &&
        createPortal(
          <div className="modal-overlay" onClick={() => !savingStock && setStockModalProduct(null)}>
            <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
                <h3 style={{ margin: 0, color: 'var(--color-plum)' }}>Update Inventory: {stockModalProduct.name}</h3>
                <button type="button" onClick={() => setStockModalProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {stockModalProduct.variants.length > 0 ? (
                  stockModalProduct.variants.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{v.variantName}</span>
                      <input
                        type="number"
                        min={0}
                        value={stockDrafts[v.id] ?? v.stock}
                        onChange={e => setStockDrafts(prev => ({ ...prev, [v.id]: Math.max(0, Number(e.target.value)) }))}
                        className="input-field"
                        style={{ width: '95px' }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Available Stock</span>
                    <input
                      type="number"
                      min={0}
                      value={stockDrafts.base ?? stockModalProduct.stock}
                      onChange={e => setStockDrafts(prev => ({ ...prev, base: Math.max(0, Number(e.target.value)) }))}
                      className="input-field"
                      style={{ width: '100px' }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem' }}>
                  <button type="button" onClick={() => setStockModalProduct(null)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="button" disabled={savingStock} onClick={handleSaveStock} className="btn btn-primary btn-sm">
                    {savingStock ? 'Saving...' : 'Save Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CATEGORY EDITOR MODAL */}
      {catModalOpen &&
        createPortal(
          <div className="modal-overlay" onClick={() => setCatModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
                <h3 style={{ margin: 0 }}>{editingCat ? 'Edit Category' : 'Add Product Category'}</h3>
                <button type="button" onClick={() => setCatModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveCategory} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Category Name *</label>
                  <input type="text" required value={catName} onChange={e => setCatName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Description</label>
                  <textarea rows={2} value={catDesc} onChange={e => setCatDesc(e.target.value)} className="input-field" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button type="button" onClick={() => setCatModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Category</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ConfirmActionModal
        open={Boolean(deleteProductTarget)}
        title="Delete Physical Product?"
        itemLabel={deleteProductTarget ? `"${deleteProductTarget.name}"` : undefined}
        description="This physical product, its variants, and active cart/wishlist references will be permanently deleted. Historical order line-item snapshots remain safely recorded."
        confirmLabel="Delete Product"
        isProcessing={deletingItem}
        errorMessage={deleteProductTarget ? errorMsg : null}
        onCancel={() => {
          setDeleteProductTarget(null);
          setErrorMsg(null);
        }}
        onConfirm={confirmDeleteProduct}
      />

      <ConfirmActionModal
        open={Boolean(deleteCategoryTarget)}
        title="Delete Product Category?"
        itemLabel={deleteCategoryTarget ? `"${deleteCategoryTarget.name}"` : undefined}
        description="This shop product category will be permanently removed. Products previously assigned to this category will become uncategorized."
        confirmLabel="Delete Category"
        isProcessing={deletingItem}
        errorMessage={deleteCategoryTarget ? errorMsg : null}
        onCancel={() => {
          setDeleteCategoryTarget(null);
          setErrorMsg(null);
        }}
        onConfirm={confirmDeleteProductCategory}
      />
    </div>
  );
};
export default AdminProducts;
