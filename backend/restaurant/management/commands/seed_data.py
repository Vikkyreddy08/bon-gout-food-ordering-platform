from django.core.management.base import BaseCommand
from restaurant.models import Category, MenuItem, Restaurant

class Command(BaseCommand):
    help = 'Seeds the database with initial restaurant, category, and menu data'

    def handle(self, *args, **options):
        # 1. Create Restaurant
        restaurant, created = Restaurant.objects.get_or_create(
            name="Food Paradise",
            defaults={
                "address": "Hyderabad, Telangana",
                "phone": "9876543210"
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Restaurant: {restaurant.name}'))

        # 2. Create Categories
        categories_names = ['Starters', 'Main Course', 'Biryani', 'Chinese', 'Desserts', 'Beverages']
        category_map = {}
        for name in categories_names:
            category, created = Category.objects.get_or_create(name=name)
            category_map[name] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Category: {name}'))

        # 3. Define Dishes (at least 45-50 items)
        menu_data = [
            # STARTERS
            {"name": "Chicken 65", "price": 200, "category": "Starters", "is_veg": False, "is_spicy": True, "description": "Spicy, deep-fried chicken bites."},
            {"name": "Chicken Lollipop", "price": 220, "category": "Starters", "is_veg": False, "is_spicy": True, "description": "Chicken drummettes marinated and deep-fried."},
            {"name": "Paneer Tikka", "price": 180, "category": "Starters", "is_veg": True, "is_spicy": False, "description": "Grilled cottage cheese marinated in spices."},
            {"name": "Veg Manchurian", "price": 160, "category": "Starters", "is_veg": True, "is_spicy": True, "description": "Vegetable balls in a tangy sauce."},
            {"name": "Chilli Chicken", "price": 210, "category": "Starters", "is_veg": False, "is_spicy": True, "description": "Spicy Indo-Chinese chicken dish."},
            {"name": "Spring Rolls", "price": 150, "category": "Starters", "is_veg": True, "is_spicy": False, "description": "Crispy pastry rolls filled with vegetables."},
            {"name": "Gobi 65", "price": 140, "category": "Starters", "is_veg": True, "is_spicy": True, "description": "Spicy fried cauliflower florets."},
            {"name": "Hariyali Kebab", "price": 230, "category": "Starters", "is_veg": False, "is_spicy": False, "description": "Green marinated grilled chicken kebabs."},
            {"name": "Fish Tikka", "price": 280, "category": "Starters", "is_veg": False, "is_spicy": False, "description": "Spiced grilled fish cubes."},

            # MAIN COURSE
            {"name": "Butter Chicken", "price": 280, "category": "Main Course", "is_veg": False, "is_spicy": False, "description": "Creamy tomato-based chicken curry."},
            {"name": "Paneer Butter Masala", "price": 220, "category": "Main Course", "is_veg": True, "is_spicy": False, "description": "Rich paneer cubes in buttery gravy."},
            {"name": "Kadai Chicken", "price": 260, "category": "Main Course", "is_veg": False, "is_spicy": True, "description": "Chicken cooked with bell peppers and spices."},
            {"name": "Dal Tadka", "price": 150, "category": "Main Course", "is_veg": True, "is_spicy": False, "description": "Yellow lentils tempered with cumin and garlic."},
            {"name": "Mixed Veg Curry", "price": 170, "category": "Main Course", "is_veg": True, "is_spicy": False, "description": "A variety of vegetables cooked in a spiced gravy."},
            {"name": "Chicken Curry", "price": 250, "category": "Main Course", "is_veg": False, "is_spicy": True, "description": "Home-style spicy chicken curry."},
            {"name": "Palak Paneer", "price": 200, "category": "Main Course", "is_veg": True, "is_spicy": False, "description": "Paneer cubes in a creamy spinach gravy."},
            {"name": "Chicken Masala", "price": 240, "category": "Main Course", "is_veg": False, "is_spicy": True, "description": "Spiced chicken gravy with traditional flavors."},
            {"name": "Aloo Gobi", "price": 160, "category": "Main Course", "is_veg": True, "is_spicy": False, "description": "Potatoes and cauliflower sautéed with spices."},
            {"name": "Mutton Rogan Josh", "price": 380, "category": "Main Course", "is_veg": False, "is_spicy": True, "description": "Aromatic Kashmiri mutton curry."},

            # BIRYANI
            {"name": "Chicken Biryani", "price": 250, "category": "Biryani", "is_veg": False, "is_spicy": True, "description": "Aromatic basmati rice with spiced chicken."},
            {"name": "Mutton Biryani", "price": 320, "category": "Biryani", "is_veg": False, "is_spicy": True, "description": "Slow-cooked rice with tender mutton."},
            {"name": "Veg Biryani", "price": 180, "category": "Biryani", "is_veg": True, "is_spicy": True, "description": "Fragrant rice cooked with mixed vegetables."},
            {"name": "Egg Biryani", "price": 200, "category": "Biryani", "is_veg": False, "is_spicy": True, "description": "Spiced rice with boiled eggs."},
            {"name": "Paneer Biryani", "price": 220, "category": "Biryani", "is_veg": True, "is_spicy": True, "description": "Basmati rice with spiced cottage cheese."},
            {"name": "Hyderabadi Chicken Biryani", "price": 280, "category": "Biryani", "is_veg": False, "is_spicy": True, "description": "The world-famous dum style biryani."},
            {"name": "Special Boneless Biryani", "price": 300, "category": "Biryani", "is_veg": False, "is_spicy": True, "description": "Biryani served with juicy boneless chicken."},

            # CHINESE
            {"name": "Veg Fried Rice", "price": 180, "category": "Chinese", "is_veg": True, "is_spicy": False, "description": "Classic stir-fried rice with vegetables."},
            {"name": "Chicken Fried Rice", "price": 220, "category": "Chinese", "is_veg": False, "is_spicy": False, "description": "Stir-fried rice with chicken bits."},
            {"name": "Schezwan Rice", "price": 200, "category": "Chinese", "is_veg": True, "is_spicy": True, "description": "Spicy stir-fried rice with Schezwan sauce."},
            {"name": "Hakka Noodles", "price": 170, "category": "Chinese", "is_veg": True, "is_spicy": False, "description": "Standard vegetable stir-fried noodles."},
            {"name": "Chicken Noodles", "price": 210, "category": "Chinese", "is_veg": False, "is_spicy": False, "description": "Wok-tossed noodles with chicken."},
            {"name": "Paneer Noodles", "price": 190, "category": "Chinese", "is_veg": True, "is_spicy": False, "description": "Stir-fried noodles with paneer cubes."},
            {"name": "Chicken Manchurian", "price": 230, "category": "Chinese", "is_veg": False, "is_spicy": True, "description": "Fried chicken balls in a thick soy sauce gravy."},
            {"name": "Chilli Paneer", "price": 200, "category": "Chinese", "is_veg": True, "is_spicy": True, "description": "Spicy paneer chunks with peppers and soy."},

            # DESSERTS
            {"name": "Gulab Jamun", "price": 100, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Deep-fried milk dumplings in sugar syrup."},
            {"name": "Rasgulla", "price": 100, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Soft and spongy milk-based dessert."},
            {"name": "Ice Cream", "price": 120, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Vanilla, Chocolate, or Strawberry flavors."},
            {"name": "Brownie", "price": 150, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Rich chocolate brownie with a gooey center."},
            {"name": "Kheer", "price": 130, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Traditional Indian rice pudding."},
            {"name": "Double Ka Meetha", "price": 140, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Bread pudding dessert with saffron and nuts."},
            {"name": "Qubani Ka Meetha", "price": 160, "category": "Desserts", "is_veg": True, "is_spicy": False, "description": "Apricot-based dessert, a Hyderabadi specialty."},

            # BEVERAGES
            {"name": "Coke", "price": 50, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Chilled Coca-Cola (300ml)."},
            {"name": "Pepsi", "price": 50, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Chilled Pepsi (300ml)."},
            {"name": "Sprite", "price": 50, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Chilled Sprite (300ml)."},
            {"name": "Lemon Juice", "price": 60, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Refreshing fresh lemon juice."},
            {"name": "Mango Juice", "price": 80, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Freshly squeezed mango juice."},
            {"name": "Lassi", "price": 70, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Traditional sweet yogurt-based drink."},
            {"name": "Buttermilk", "price": 60, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Refreshing spiced buttermilk."},
            {"name": "Cold Coffee", "price": 90, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "Creamy chilled coffee with ice cream."},
            {"name": "Thums Up", "price": 50, "category": "Beverages", "is_veg": True, "is_spicy": False, "description": "The strong Indian cola."},
        ]

        # 4. Create Menu Items
        for item in menu_data:
            menu_item, created = MenuItem.objects.get_or_create(
                name=item["name"],
                restaurant=restaurant,
                defaults={
                    "category": category_map[item["category"]],
                    "price": item["price"],
                    "description": item["description"],
                    "is_veg": item["is_veg"],
                    "is_spicy": item["is_spicy"],
                    "prep_time": "15min",
                    "available": True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Added dish: {item["name"]}'))

        self.stdout.write(self.style.SUCCESS("Successfully added menu data"))
