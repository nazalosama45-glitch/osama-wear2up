import re

file_path = r"c:\Users\IDEAPAD GAMING\Desktop\osama-wear\script.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update CONFIG currency
content = content.replace("currency: '$'", "currency: 'JOD '")

# 2. Update DEFAULT_PRODUCTS
old_products = """const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Classic Oversized Tee', category: 'T-Shirts', price: 25, emoji: '👕', description: 'Premium cotton oversized fit. Perfect for everyday wear.', badge: 'Best Seller' },
  { id: 2, name: 'Streetwear Hoodie', category: 'Hoodies', price: 55, emoji: '🧥', description: 'Heavyweight fleece, relaxed fit with kangaroo pocket.', badge: 'New' },
  { id: 3, name: 'Slim Cargo Pants', category: 'Bottoms', price: 45, emoji: '👖', description: 'Utility-style cargo pants with multiple pockets.', badge: '' },
  { id: 4, name: 'Graphic Drop Tee', category: 'T-Shirts', price: 30, emoji: '🎨', description: 'Bold graphic print on premium cotton. Limited stock.', badge: 'Hot' },
  { id: 5, name: 'Ribbed Knit Sweater', category: 'Knits', price: 50, emoji: '🧶', description: 'Cozy ribbed knit in neutral shades. Wear it all season.', badge: '' },
  { id: 6, name: 'Logo Cap', category: 'Accessories', price: 18, emoji: '🧢', description: 'Structured 6-panel cap with embroidered logo.', badge: '' },
];"""

new_products = """const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Premium Oversized Hoodie', category: 'Hoodies', price: 45, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', description: 'Heavyweight premium fleece. Relaxed modern fit.', badge: 'Best Seller' },
  { id: 2, name: 'Classic Streetwear Tee', category: 'T-Shirts', price: 25, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', description: 'Premium cotton oversized fit. Perfect for everyday wear.', badge: 'New' },
  { id: 3, name: 'Utility Cargo Pants', category: 'Bottoms', price: 55, image: 'https://images.unsplash.com/photo-1624378439575-d1ead6bbd7bd?q=80&w=800&auto=format&fit=crop', description: 'Utility-style cargo pants with multiple pockets and perfect drape.', badge: '' },
  { id: 4, name: 'Signature Logo Cap', category: 'Accessories', price: 15, image: 'https://images.unsplash.com/photo-1588850561407-ed78c281ef5f?q=80&w=800&auto=format&fit=crop', description: 'Structured 6-panel cap with minimalist embroidered logo.', badge: 'Hot' },
];"""

content = content.replace(old_products, new_products)

# 3. renderProducts map
old_card_html = """      <div class="product-image-placeholder">
        <span>${p.emoji || '👕'}</span>
        <span style="font-size:0.72rem;letter-spacing:1px;">${p.category.toUpperCase()}</span>
      </div>"""
new_card_html = """      <div class="product-image-wrapper">
        <img src="${p.image || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'}" alt="${p.name}" class="product-image-render" />
      </div>"""
content = content.replace(old_card_html, new_card_html)

# 4. addToCart and Cartesian push
content = content.replace("emoji: product.emoji || '👕'", "image: product.image")

# 5. renderCartItems
old_cart_html = """      <div class="cart-item-icon">${item.emoji}</div>"""
new_cart_html = """      <div class="cart-item-image"><img src="${item.image}" alt="" style="width:50px; height:50px; object-fit:cover; border-radius:4px; border:1px solid var(--border);" /></div>"""
content = content.replace(old_cart_html, new_cart_html)

# 6. Checkout rendering
old_checkout = "row.innerHTML = `<span>${item.emoji} ${item.name} ×${item.qty}</span><span>${CONFIG.currency}${(item.price * item.qty).toFixed(2)}</span>`;"
new_checkout = "row.innerHTML = `<span style=\\"display:flex;align-items:center;gap:8px;\\"><img src=\\"${item.image}\\" style=\\"width:24px;height:24px;object-fit:cover;border-radius:4px;\\">${item.name} ×${item.qty}</span><span>${CONFIG.currency}${(item.price * item.qty).toFixed(2)}</span>`;"
content = content.replace(old_checkout, new_checkout)

# 7. Admin Products rendering
old_admin_td = """<td style="font-size:1.5rem;text-align:center;">${p.emoji || '👕'}</td>"""
new_admin_td = """<td style="text-align:center;"><img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" /></td>"""
content = content.replace(old_admin_td, new_admin_td)

# 8. Admin openProductModal
content = content.replace("document.getElementById('product-emoji').value = p.emoji || '';", "document.getElementById('product-image').value = p.image || '';")

# 9. Admin saveProduct
content = content.replace("const emoji = document.getElementById('product-emoji').value.trim() || '👕';", "const image = document.getElementById('product-image').value.trim();")
content = content.replace(", emoji,", ", image,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated script.js successfully")
