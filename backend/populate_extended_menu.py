import os
import django
import sys

# Setup Django environment
sys.path.append('c:/Users/ASUS/OneDrive/Documents/Desktop/reactfn/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bon_gout.settings')
django.setup()

from restaurant.models import Category, MenuItem

def populate_extended_menu():
    # 1. Categories
    categories_data = [
        'Biryani', 'Starters', 'Curry', 'Grill', 'Pizza', 'Chinese', 'Special', 'Dessert', 'Drinks', 'Burgers', 'Pasta'
    ]
    
    cat_map = {}
    for cat_name in categories_data:
        cat, _ = Category.objects.get_or_create(name=cat_name)
        cat_map[cat_name] = cat

    # 2. Detailed Menu Items
    menu_items = [
        # BIRYANI
        # BIRYANI
        {
            'name': 'Chicken Dum Biryani',
            'category': cat_map['Biryani'],
            'price': 299.00,
            'description': 'Authentic Hyderabadi dum style with saffron rice and tender chicken.',
            'image': 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?q=80&w=800',
            'is_veg': False, 'is_spicy': True, 'prep_time': '25min'
        },
        {
            'name': 'Mutton Dum Biryani',
            'category': cat_map['Biryani'],
            'price': 449.00,
            'description': 'Royal mutton biryani slow-cooked with aromatic spices.',
            'image': 'https://images.unsplash.com/photo-1589187151032-573a91317445?q=80&w=800',
            'is_veg': False, 'is_spicy': True, 'prep_time': '35min'
        },
        {
            'name': 'Egg Biryani',
            'category': cat_map['Biryani'],
            'price': 249.00,
            'description': 'Fragrant basmati rice with spiced boiled eggs.',
            'image': 'https://images.unsplash.com/photo-1596797038558-b12b8c595742?q=80&w=800',
            'is_veg': False, 'is_spicy': False, 'prep_time': '20min'
        },
        
        # STARTERS
        {
            'name': 'Chicken 65',
            'category': cat_map['Starters'],
            'price': 199.00,
            'description': 'Spicy, deep-fried chicken bites - a Hyderabad favorite.',
            'image': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=800',
            'is_veg': False, 'is_spicy': True, 'prep_time': '12min'
        },
        {
            'name': 'Paneer 65',
            'category': cat_map['Starters'],
            'price': 189.00,
            'description': 'Crispy fried paneer cubes tossed in spicy 65 masala.',
            'image': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800',
            'is_veg': True, 'is_spicy': True, 'prep_time': '15min'
        },
        {
            'name': 'Onion Rings',
            'category': cat_map['Starters'],
            'price': 129.00,
            'description': 'Golden brown crispy onion rings served with dip.',
            'image': 'https://images.unsplash.com/photo-1639332212923-b550cedc63d2?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '10min'
        },

        # BURGERS
        {
            'name': 'Zinger Burger',
            'category': cat_map['Burgers'],
            'price': 179.00,
            'description': 'Crispy chicken fillet with lettuce and mayo.',
            'image': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
            'is_veg': False, 'is_spicy': False, 'prep_time': '15min'
        },
        {
            'name': 'Veggie Delight Burger',
            'category': cat_map['Burgers'],
            'price': 149.00,
            'description': 'Hearty veg patty with fresh veggies and special sauce.',
            'image': 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '12min'
        },

        # PIZZA
        {
            'name': 'Margherita Pizza',
            'category': cat_map['Pizza'],
            'price': 249.00,
            'description': 'Classic cheese pizza with fresh tomato sauce and basil.',
            'image': 'https://images.unsplash.com/photo-1601924582975-7e88a3b4a68d?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '20min'
        },
        {
            'name': 'BBQ Chicken Pizza',
            'category': cat_map['Pizza'],
            'price': 349.00,
            'description': 'Loaded with BBQ chicken, onions, and extra cheese.',
            'image': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
            'is_veg': False, 'is_spicy': False, 'prep_time': '25min'
        },

        # DESSERT
        {
            'name': 'Double Ka Meetha',
            'category': cat_map['Dessert'],
            'price': 149.00,
            'description': 'Traditional Hyderabadi bread pudding with saffron and nuts.',
            'image': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '8min'
        },
        {
            'name': 'Chocolate Brownie',
            'category': cat_map['Dessert'],
            'price': 199.00,
            'description': 'Warm, gooey chocolate brownie with vanilla ice cream.',
            'image': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '10min'
        },

        # DRINKS
        {
            'name': 'Mango Lassi',
            'category': cat_map['Drinks'],
            'price': 89.00,
            'description': 'Refreshing yogurt-based mango smoothie.',
            'image': 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '3min'
        },
        {
            'name': 'Iced Coffee',
            'category': cat_map['Drinks'],
            'price': 119.00,
            'description': 'Chilled brewed coffee with a hint of vanilla.',
            'image': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800',
            'is_veg': True, 'is_spicy': False, 'prep_time': '5min'
        }
    ]

    for item in menu_items:
        MenuItem.objects.update_or_create(
            name=item['name'],
            defaults=item
        )
    print(f"Successfully populated {len(menu_items)} dishes across various categories.")

if __name__ == "__main__":
    populate_extended_menu()
