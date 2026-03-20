import os
import django
import sys

# Setup Django environment
sys.path.append('c:/Users/ASUS/OneDrive/Documents/Desktop/reactfn/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bon_gout.settings')
django.setup()

from restaurant.models import Category

def update_category_images():
    category_images = {
        'Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&w=800&q=80',
        'Starters': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
        'Curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
        'Grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        'Chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
        'Special': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        'Dessert': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        'Drinks': 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?auto=format&fit=crop&w=800&q=80',
        'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        'Pasta': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=800&q=80'
    }

    updated_count = 0
    for name, img_url in category_images.items():
        cat = Category.objects.filter(name=name).first()
        if cat:
            cat.image = img_url
            cat.save()
            updated_count += 1
            print(f"✅ Updated image for: {name}")
        else:
            # Create if missing
            Category.objects.create(name=name, image=img_url)
            updated_count += 1
            print(f"✨ Created and added image for: {name}")

    print(f"\nSuccessfully processed {updated_count} categories.")

if __name__ == "__main__":
    update_category_images()
