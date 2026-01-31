"""
Seed script to populate the database with sample data.
Runs automatically on Cloud Run startup when SEED_DATA=true
Can also be run manually: python seed_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy import select, func
from app.database import async_session_maker, init_db
from app.models.user import User
from app.models.event import Event, EventFoodItem, EventStatus
from app.models.rsvp import RSVP, RSVPStatus
from app.auth import get_password_hash


async def seed_database():
    await init_db()

    async with async_session_maker() as db:
        # Check if events already exist (more reliable check)
        existing_events = await db.execute(select(func.count()).select_from(Event))
        event_count = existing_events.scalar()
        if event_count > 0:
            print(f"Database already has {event_count} events. Skipping seed.")
            return

        # Check if users exist - if not, create them
        existing_users = await db.execute(select(func.count()).select_from(User))
        user_count = existing_users.scalar()

        print(f"Seeding database... (found {user_count} existing users, {event_count} events)")

        # Create users with fun personalities (only if they don't exist)
        if user_count == 0:
            print("Creating demo users...")
            users = [
            User(
                email="maya@example.com",
                username="maya_cooks",
                hashed_password=get_password_hash("demo1234"),
                full_name="Maya Chen",
                trust_score=98,
                events_hosted=12,
                events_attended=28,
                referral_code="MAYA2024",
                referral_points=450,
            ),
            User(
                email="jordan@example.com",
                username="jordan_eats",
                hashed_password=get_password_hash("demo1234"),
                full_name="Jordan Rivera",
                trust_score=95,
                events_hosted=8,
                events_attended=22,
                referral_code="JRIV2024",
                referral_points=320,
            ),
            User(
                email="sam@example.com",
                username="samurai_chef",
                hashed_password=get_password_hash("demo1234"),
                full_name="Sam Nakamura",
                trust_score=100,
                events_hosted=15,
                events_attended=35,
                referral_code="SAMNK24",
                referral_points=680,
            ),
            User(
                email="priya@example.com",
                username="priya_spice",
                hashed_password=get_password_hash("demo1234"),
                full_name="Priya Sharma",
                trust_score=92,
                events_hosted=6,
                events_attended=18,
                referral_code="PRIYA24",
                referral_points=220,
            ),
            User(
                email="alex@example.com",
                username="alex_grills",
                hashed_password=get_password_hash("demo1234"),
                full_name="Alex Thompson",
                trust_score=88,
                events_hosted=4,
                events_attended=15,
                referral_code="ALEXT24",
                referral_points=180,
            ),
            User(
                email="luna@example.com",
                username="luna_bakes",
                hashed_password=get_password_hash("demo1234"),
                full_name="Luna Martinez",
                trust_score=97,
                events_hosted=9,
                events_attended=24,
                referral_code="LUNA2024",
                referral_points=390,
            ),
            User(
                email="demo@example.com",
                username="demo_user",
                hashed_password=get_password_hash("demo1234"),
                full_name="Demo Account",
                trust_score=100,
                referral_code="DEMO2024",
                referral_points=100,
            ),
        ]

            for user in users:
                db.add(user)
            await db.flush()
            print(f"Created {len(users)} demo users")
        else:
            print(f"Users already exist, skipping user creation")

        # Get user IDs for event creation
        result = await db.execute(select(User).order_by(User.id))
        all_users = result.scalars().all()
        user_map = {u.username: u.id for u in all_users}
        print(f"User map: {user_map}")

        # Create diverse, interesting events
        print("Creating events...")
        sam_id = user_map.get("samurai_chef", 3)
        jordan_id = user_map.get("jordan_eats", 2)
        maya_id = user_map.get("maya_cooks", 1)
        priya_id = user_map.get("priya_spice", 4)
        alex_id = user_map.get("alex_grills", 5)
        luna_id = user_map.get("luna_bakes", 6)

        events = [
            Event(
                title="Homemade Ramen Night",
                description="I've been perfecting my tonkotsu ramen recipe for months. 12-hour pork bone broth, chashu, soft-boiled eggs, the works. Limited to 6 people so everyone gets proper bowls. Bring your appetite and maybe some Japanese beer!",
                event_date=datetime.utcnow() + timedelta(days=5, hours=18),
                location_name="Sam's Kitchen",
                location_address="742 Evergreen Terrace, Unit 3",
                location_notes="Ring buzzer 3, elevator to 4th floor",
                max_guests=6,
                reserved_spots=1,
                min_guests=4,
                rsvp_deadline=datetime.utcnow() + timedelta(days=3),
                confirmation_deadline=datetime.utcnow() + timedelta(days=4),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=sam_id,
            ),
            Event(
                title="Taco Tuesday Gone Wild",
                description="Not your average taco night. We're doing birria tacos with consomme for dipping, plus street corn and horchata. I'll handle the meat, you bring the sides and drinks. Vegetarian birria option available!",
                event_date=datetime.utcnow() + timedelta(days=2, hours=19),
                location_name="Jordan's Place",
                location_address="2847 Mission Street",
                location_notes="Yellow house, come through the side gate",
                max_guests=10,
                min_guests=5,
                rsvp_deadline=datetime.utcnow() + timedelta(days=1),
                confirmation_deadline=datetime.utcnow() + timedelta(days=1, hours=12),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=jordan_id,
            ),
            Event(
                title="Dumpling Making Party",
                description="Let's fold some dumplings together! I'll prep the fillings (pork & chive, veggie, and shrimp), you help wrap them. No experience needed - I'll teach you the pleating technique. We eat what we make!",
                event_date=datetime.utcnow() + timedelta(days=8, hours=14),
                location_name="Maya's Apartment",
                location_address="88 Luck Street, Apt 8B",
                max_guests=8,
                min_guests=4,
                rsvp_deadline=datetime.utcnow() + timedelta(days=5),
                confirmation_deadline=datetime.utcnow() + timedelta(days=6),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=maya_id,
            ),
            Event(
                title="Indian Feast: Curry & Naan Night",
                description="Full spread: butter chicken, palak paneer, dal makhani, fresh naan, and rice. I'm making the curries from scratch using my grandmother's recipes. Spice level: medium (can adjust). Bring drinks or dessert!",
                event_date=datetime.utcnow() + timedelta(days=12, hours=18, minutes=30),
                location_name="Priya's Home",
                location_address="456 Spice Lane",
                location_notes="Parking in driveway, come to back door",
                max_guests=10,
                reserved_spots=2,
                min_guests=6,
                rsvp_deadline=datetime.utcnow() + timedelta(days=9),
                confirmation_deadline=datetime.utcnow() + timedelta(days=10),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=priya_id,
            ),
            Event(
                title="Backyard BBQ & Smoked Meats",
                description="Firing up the smoker at 6am for brisket and ribs. By dinner time, we feast. Bringing my competition-style rubs and sauces. I'll handle the meats, you bring classic BBQ sides. Lawn games available!",
                event_date=datetime.utcnow() + timedelta(days=9, hours=17),
                location_name="Alex's Backyard",
                location_address="1234 Grill Master Drive",
                location_notes="Gate code: 4321, smoker's in the back",
                max_guests=15,
                min_guests=8,
                rsvp_deadline=datetime.utcnow() + timedelta(days=6),
                confirmation_deadline=datetime.utcnow() + timedelta(days=7),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=alex_id,
            ),
            Event(
                title="Dessert Potluck Extravaganza",
                description="Sweet tooths unite! Bring your best dessert and we'll feast on sugar together. I'm making a three-layer chocolate cake. Coffee and tea provided. We'll vote on the best dessert - winner gets bragging rights!",
                event_date=datetime.utcnow() + timedelta(days=6, hours=15),
                location_name="Luna's Loft",
                location_address="999 Sugar Rush Ave, Penthouse",
                max_guests=12,
                min_guests=6,
                rsvp_deadline=datetime.utcnow() + timedelta(days=4),
                confirmation_deadline=datetime.utcnow() + timedelta(days=5),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=luna_id,
            ),
            Event(
                title="Pizza From Scratch",
                description="Wood-fired pizza oven on my patio! I'll have dough ready, you bring toppings. We'll make our own pizzas and learn some techniques. Margherita, pepperoni, or get creative - anything goes!",
                event_date=datetime.utcnow() + timedelta(days=15, hours=18),
                location_name="Jordan's Patio",
                location_address="2847 Mission Street",
                location_notes="Same place as Taco Tuesday - backyard this time",
                max_guests=8,
                min_guests=4,
                rsvp_deadline=datetime.utcnow() + timedelta(days=12),
                confirmation_deadline=datetime.utcnow() + timedelta(days=13),
                status=EventStatus.OPEN.value,
                is_public=True,
                host_id=jordan_id,
            ),
        ]

        for event in events:
            db.add(event)
        await db.flush()
        print(f"Created {len(events)} events")

        # Get event IDs (they were just created)
        result = await db.execute(select(Event).order_by(Event.id))
        all_events = result.scalars().all()
        event_ids = [e.id for e in all_events]
        print(f"Event IDs: {event_ids}")

        # Food items for each event (using actual event IDs)
        if len(event_ids) >= 7:
            e1, e2, e3, e4, e5, e6, e7 = event_ids[:7]
            food_items = [
                # Ramen Night
                EventFoodItem(event_id=e1, name="Japanese Beer", description="Sapporo, Asahi, or similar - 6 pack", quantity_needed=2),
                EventFoodItem(event_id=e1, name="Sake", description="For toasting!", quantity_needed=1),
                EventFoodItem(event_id=e1, name="Edamame", description="As appetizer while ramen finishes", quantity_needed=1),

                # Taco Tuesday
                EventFoodItem(event_id=e2, name="Mexican Street Corn", description="Elote style, enough for 10", quantity_needed=1),
                EventFoodItem(event_id=e2, name="Guacamole", description="Fresh, chunky style", quantity_needed=2),
                EventFoodItem(event_id=e2, name="Horchata", description="Homemade or store-bought, 1 gallon", quantity_needed=1),
                EventFoodItem(event_id=e2, name="Churros", description="For dessert!", quantity_needed=1),
                EventFoodItem(event_id=e2, name="Mexican Beer/Soda", description="Modelo, Jarritos, etc", quantity_needed=2),

                # Dumpling Party
                EventFoodItem(event_id=e3, name="Dipping Sauces", description="Chili oil, soy sauce, black vinegar", quantity_needed=1),
                EventFoodItem(event_id=e3, name="Asian Beer", description="Tsingtao, Sapporo, etc", quantity_needed=2),
                EventFoodItem(event_id=e3, name="Cucumber Salad", description="Light refreshing side", quantity_needed=1),
                EventFoodItem(event_id=e3, name="Bubble Tea", description="Pick up from boba shop", quantity_needed=4),

                # Indian Feast
                EventFoodItem(event_id=e4, name="Mango Lassi", description="Sweet yogurt drink, 1 pitcher", quantity_needed=1),
                EventFoodItem(event_id=e4, name="Samosas", description="From the good place on Oak St", quantity_needed=1),
                EventFoodItem(event_id=e4, name="Gulab Jamun", description="Indian dessert balls", quantity_needed=1),
                EventFoodItem(event_id=e4, name="Indian Beer/Wine", description="Kingfisher or white wine", quantity_needed=2),
                EventFoodItem(event_id=e4, name="Raita", description="Yogurt cucumber sauce", quantity_needed=1),

                # BBQ
                EventFoodItem(event_id=e5, name="Coleslaw", description="Creamy or vinegar-based, feeds 15", quantity_needed=1),
                EventFoodItem(event_id=e5, name="Mac & Cheese", description="The good homemade kind", quantity_needed=1),
                EventFoodItem(event_id=e5, name="Cornbread", description="With honey butter please!", quantity_needed=1),
                EventFoodItem(event_id=e5, name="Baked Beans", description="BBQ style, big batch", quantity_needed=1),
                EventFoodItem(event_id=e5, name="Pickles & Onions", description="Classic BBQ sides", quantity_needed=1),
                EventFoodItem(event_id=e5, name="Beer/Lemonade", description="Cooler full", quantity_needed=3),
                EventFoodItem(event_id=e5, name="Peach Cobbler", description="For dessert", quantity_needed=1),

                # Dessert Potluck
                EventFoodItem(event_id=e6, name="Your Best Dessert", description="Homemade preferred, serve 8+", quantity_needed=8),
                EventFoodItem(event_id=e6, name="Ice Cream", description="Vanilla, to pair with everything", quantity_needed=1),
                EventFoodItem(event_id=e6, name="Fresh Berries", description="For topping/decoration", quantity_needed=1),

                # Pizza Night
                EventFoodItem(event_id=e7, name="Fresh Mozzarella", description="The good buffalo stuff", quantity_needed=2),
                EventFoodItem(event_id=e7, name="Pepperoni/Sausage", description="Quality meats", quantity_needed=1),
                EventFoodItem(event_id=e7, name="Veggies", description="Mushrooms, peppers, olives, etc", quantity_needed=2),
                EventFoodItem(event_id=e7, name="Arugula & Prosciutto", description="For fancy white pizzas", quantity_needed=1),
                EventFoodItem(event_id=e7, name="Italian Wine", description="Red or white", quantity_needed=2),
                EventFoodItem(event_id=e7, name="Caesar Salad", description="Classic side", quantity_needed=1),
            ]

            for item in food_items:
                db.add(item)
            print(f"Created {len(food_items)} food items")

            # Create RSVPs to make events look active (using actual user and event IDs)
            rsvps = [
                # Ramen Night RSVPs
                RSVP(user_id=maya_id, event_id=e1, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Sake"),
                RSVP(user_id=priya_id, event_id=e1, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Edamame"),
                RSVP(user_id=luna_id, event_id=e1, status=RSVPStatus.PENDING.value, guest_count=1, bringing_food_item="Japanese Beer"),

                # Taco Tuesday RSVPs
                RSVP(user_id=maya_id, event_id=e2, status=RSVPStatus.CONFIRMED.value, guest_count=2, bringing_food_item="Guacamole"),
                RSVP(user_id=sam_id, event_id=e2, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Street Corn"),
                RSVP(user_id=alex_id, event_id=e2, status=RSVPStatus.CONFIRMED.value, guest_count=2, bringing_food_item="Mexican Beer"),
                RSVP(user_id=luna_id, event_id=e2, status=RSVPStatus.PENDING.value, guest_count=1, bringing_food_item="Churros"),

                # Dumpling Party RSVPs
                RSVP(user_id=jordan_id, event_id=e3, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Asian Beer"),
                RSVP(user_id=priya_id, event_id=e3, status=RSVPStatus.CONFIRMED.value, guest_count=2, bringing_food_item="Bubble Tea"),
                RSVP(user_id=alex_id, event_id=e3, status=RSVPStatus.PENDING.value, guest_count=1, bringing_food_item="Cucumber Salad"),

                # Indian Feast RSVPs
                RSVP(user_id=maya_id, event_id=e4, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Mango Lassi"),
                RSVP(user_id=sam_id, event_id=e4, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Samosas"),
                RSVP(user_id=luna_id, event_id=e4, status=RSVPStatus.PENDING.value, guest_count=2, bringing_food_item="Gulab Jamun"),

                # BBQ RSVPs
                RSVP(user_id=maya_id, event_id=e5, status=RSVPStatus.CONFIRMED.value, guest_count=2, bringing_food_item="Mac & Cheese"),
                RSVP(user_id=jordan_id, event_id=e5, status=RSVPStatus.CONFIRMED.value, guest_count=2, bringing_food_item="Coleslaw"),
                RSVP(user_id=sam_id, event_id=e5, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Beer"),
                RSVP(user_id=priya_id, event_id=e5, status=RSVPStatus.CONFIRMED.value, guest_count=2, bringing_food_item="Cornbread"),
                RSVP(user_id=luna_id, event_id=e5, status=RSVPStatus.PENDING.value, guest_count=1, bringing_food_item="Peach Cobbler"),

                # Dessert Potluck RSVPs
                RSVP(user_id=maya_id, event_id=e6, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Tiramisu"),
                RSVP(user_id=jordan_id, event_id=e6, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Key Lime Pie"),
                RSVP(user_id=sam_id, event_id=e6, status=RSVPStatus.CONFIRMED.value, guest_count=1, bringing_food_item="Mochi Ice Cream"),
                RSVP(user_id=priya_id, event_id=e6, status=RSVPStatus.PENDING.value, guest_count=1, bringing_food_item="Kheer"),
                RSVP(user_id=alex_id, event_id=e6, status=RSVPStatus.PENDING.value, guest_count=2, bringing_food_item="Brownies"),
            ]

            for rsvp in rsvps:
                db.add(rsvp)
            print(f"Created {len(rsvps)} RSVPs")

        await db.commit()
        print("DATABASE SEEDED SUCCESSFULLY!")
        print("\nDemo Accounts (password: demo1234):")
        print("-" * 40)
        print("  maya@example.com    (maya_cooks)")
        print("  jordan@example.com  (jordan_eats)")
        print("  sam@example.com     (samurai_chef)")
        print("  priya@example.com   (priya_spice)")
        print("  alex@example.com    (alex_grills)")
        print("  luna@example.com    (luna_bakes)")
        print("  demo@example.com    (demo_user)")
        print("-" * 40)
        print("\nReferral codes you can use to register:")
        print("  MAYA2024, JRIV2024, SAMNK24, PRIYA24")
        print("  ALEXT24, LUNA2024, DEMO2024")


if __name__ == "__main__":
    asyncio.run(seed_database())
