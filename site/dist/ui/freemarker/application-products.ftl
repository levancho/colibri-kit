[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section data-application-component="products"><header><h3>${model.title}</h3><p>${model.description}</p></header><div class="store-products">[#list model.products as product]<article class="store-product"><span class="product-photo" data-product="${product.sprite}"><img src="${product.image}" alt="${product.name}" width="320" height="180" loading="lazy"></span><h3>${product.name}</h3><p>${product.price}</p><small>${product.stock}</small><button class="btn" type="button" data-app-action="add-product" data-id="${product.id}">Add to order</button></article>[/#list]</div><p role="status" data-cart-status="">No items added.</p></section>
[/#macro]
