from django.contrib import admin
from django.utils.html import format_html
from .models import Category, MenuItem, Order, OrderItem, Review, CarouselSlide, CustomerCareRequest


# ==========================================
# CAROUSEL SLIDE ADMIN
# ==========================================
@admin.register(CarouselSlide)
class CarouselSlideAdmin(admin.ModelAdmin):
    list_display = ['image_preview', 'title', 'order', 'is_active', 'created_at']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'subtitle']
    ordering = ['order', '-created_at']

    def image_preview(self, obj):
        url = obj.image.url if obj.image else obj.image_url
        if url:
            return format_html('<img src="{}" style="width: 100px; height: 50px; border-radius: 4px; object-fit: cover;" />', url)
        return "🖼️ No Image"
    image_preview.short_description = 'Slide'

# ==========================================
# CUSTOMER CARE ADMIN
# ==========================================
@admin.register(CustomerCareRequest)
class CustomerCareAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'is_resolved', 'created_at']
    list_editable = ['is_resolved']
    list_filter = ['is_resolved', 'created_at']
    search_fields = ['name', 'phone', 'message']
    ordering = ['-created_at']


# ==========================================
# CATEGORY ADMIN
# ==========================================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['image_preview', 'name', 'id']
    search_fields = ['name']

    def image_preview(self, obj):
        # Prefer uploaded file, fallback to remote URL
        url = obj.image.url if obj.image else obj.image_url
        if url:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" />', url)
        return "🖼️ No Image"
    image_preview.short_description = 'Icon'

# ==========================================
# ORDER ITEM ADMIN (NEW)
# ==========================================
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'menu_item', 'quantity', 'price', 'get_total']
    list_filter = ['order__status', 'menu_item__category']
    search_fields = ['order__order_number', 'menu_item__name']
    readonly_fields = ['get_total']

    def get_total(self, obj):
        if obj.price and obj.quantity:
            return obj.price * obj.quantity
        return 0
    get_total.short_description = 'Total'


# ==========================================
# MENU ITEM ADMIN
# ==========================================
@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = [
        'image_preview',
        'name', 
        'category', 
        'price', 
        'is_veg', 
        'is_spicy', 
        'available',
        'is_featured',
        'average_rating',
        'total_reviews'
    ]
    
    list_filter = ['available', 'is_featured', 'category', 'is_veg', 'is_spicy']
    search_fields = ['name', 'description']
    list_editable = ['price', 'available', 'is_featured', 'is_veg', 'is_spicy']
    list_per_page = 20
    ordering = ['category', 'name']
    
    readonly_fields = ['average_rating', 'total_reviews']

    def image_preview(self, obj):
        # Prefer uploaded file, fallback to remote URL
        url = obj.image.url if obj.image else obj.image_url
        if url:
            return format_html('<img src="{}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" />', url)
        return "🖼️ No Image"
    image_preview.short_description = 'Dish'


# ==========================================
# REVIEW ADMIN
# ==========================================
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['dish', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at', 'dish']
    search_fields = ['comment', 'user__username', 'dish__name']
    readonly_fields = ['created_at']
    list_per_page = 30


# ==========================================
# ORDER ITEM INLINE
# ==========================================
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['price', 'menu_item', 'quantity', 'get_total']

    def get_total(self, obj):
        if obj.price and obj.quantity:
            return obj.price * obj.quantity
        return 0
    get_total.short_description = 'Subtotal'


# ==========================================
# ORDER ADMIN
# ==========================================
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'customer_name',
        'total_amount',
        'status',
        'payment_method',
        'created_at'
    ]

    list_filter = [
        'status',
        'payment_method',
        'created_at'
    ]

    search_fields = [
        'order_number',
        'user__username',
        'customer_name',
        'customer_phone'
    ]

    readonly_fields = [
        'order_number',
        'created_at',
        'total_amount',
        'user'
    ]

    list_editable = ['status']
    inlines = [OrderItemInline]
    list_per_page = 20

    def has_delete_permission(self, request, obj=None):
        return False