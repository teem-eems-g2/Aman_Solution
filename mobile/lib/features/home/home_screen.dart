import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  // Sampled palette constants matching UI_design.png exactly
  static const Color scaffoldBg = Color(0xFFF7F1EA);
  static const Color heroCardBg = Color(0xFF1E3526);
  static const Color goldAccent = Color(0xFFC7A870);
  static const Color textDark = Color(0xFF181818);
  static const Color textMuted = Color(0xFF757575);
  static const Color navBg = Color(0xFF101110);

  final List<Map<String, dynamic>> _categories = const [
    {
      'name': 'T-Shirts',
      'image': 'assets/images/cat_tshirt.png',
    },
    {
      'name': 'Shirts',
      'image': 'assets/images/cat_shirt.png',
    },
    {
      'name': 'Pants',
      'image': 'assets/images/cat_pants.png',
    },
    {
      'name': 'Jackets',
      'image': 'assets/images/cat_jacket.png',
    },
    {
      'name': 'Hoodies',
      'image': 'assets/images/cat_hoodie.png',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: scaffoldBg,
      body: Stack(
        children: [
          // Scrollable Home Content
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Top Section: Full-bleed Hero Model Photo with Greeting & Green Card
                _buildHeroTopSection(context),
                const SizedBox(height: 22),

                // 2. Categories Section: Circular Product Thumbnails matching mockup
                _buildCategoriesSection(context),
              ],
            ),
          ),

          // 3. Floating Pill Bottom Navigation Bar matching mockup
          Positioned(
            left: 20,
            right: 20,
            bottom: 24,
            child: _buildFloatingBottomNav(context),
          ),
        ],
      ),
    );
  }

  // 1. Full-bleed Hero Top Section: Model photo background with Greeting, Search & Green Card
  Widget _buildHeroTopSection(BuildContext context) {
    return Stack(
      children: [
        // Model Photo Background (covers entire top half down to green card)
        SizedBox(
          height: 490,
          width: double.infinity,
          child: Image.asset(
            'assets/images/home_hero_bg.jpg',
            fit: BoxFit.cover,
            alignment: const Alignment(0.0, -0.45),
          ),
        ),

        // Subtle gradient overlay at top for crystal-clear text readability
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: 140,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.45),
                  Colors.transparent,
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ),

        // Foreground: Top Bar + SUMMER VIBES Green Card
        SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              // Top Bar: White Greeting text & Circular Search Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Hello, Style',
                              style: GoogleFonts.poppins(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text('👋', style: TextStyle(fontSize: 18)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Find your perfect look',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                        ),
                      ],
                    ),
                    // Search Icon Button
                    InkWell(
                      onTap: () => context.push('/search'),
                      borderRadius: BorderRadius.circular(24),
                      child: Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.search_rounded,
                          color: textDark,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 220),

              // Solid Dark Green Card: "SUMMER VIBES"
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  decoration: BoxDecoration(
                    color: heroCardBg,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'NEW COLLECTION',
                            style: GoogleFonts.poppins(
                              color: goldAccent,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 2.0,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'SUMMER\nVIBES',
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              height: 1.1,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 10),
                          InkWell(
                            onTap: () => context.push('/categories'),
                            child: Text(
                              'Explore Now',
                              style: GoogleFonts.poppins(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Circular gold arrow button
                      InkWell(
                        onTap: () => context.push('/categories'),
                        borderRadius: BorderRadius.circular(24),
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            color: goldAccent,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 22,
                            color: textDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 2. Categories Section: Circular Product Thumbnails matching mockup
  Widget _buildCategoriesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'Categories',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: textDark,
                ),
              ),
              InkWell(
                onTap: () => context.push('/categories'),
                child: Text(
                  'See All',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 94,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: _categories.length,
            separatorBuilder: (context, index) => const SizedBox(width: 16),
            itemBuilder: (context, index) {
              final cat = _categories[index];
              return InkWell(
                onTap: () => context.push('/categories'),
                borderRadius: BorderRadius.circular(20),
                child: Column(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDE8E0),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 6,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          cat['image'] as String,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: const Color(0xFF232323),
                              child: const Icon(
                                Icons.checkroom_outlined,
                                color: Colors.white,
                                size: 24,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      cat['name'] as String,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: textDark,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // 3. Floating Pill Bottom Navigation Bar matching mockup
  Widget _buildFloatingBottomNav(BuildContext context) {
    return Container(
      height: 62,
      decoration: BoxDecoration(
        color: navBg,
        borderRadius: BorderRadius.circular(36),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // 1. Home (Active Gold)
          _buildNavItem(
            icon: Icons.home_filled,
            color: goldAccent,
            onTap: () {},
          ),
          // 2. Categories (Grid outline in White)
          _buildNavItem(
            icon: Icons.grid_view_outlined,
            color: Colors.white.withValues(alpha: 0.9),
            onTap: () => context.push('/categories'),
          ),
          // 3. Frame / Rounded Box in White
          _buildNavItem(
            icon: Icons.crop_square_rounded,
            color: Colors.white.withValues(alpha: 0.9),
            onTap: () => context.push('/search'),
          ),
          // 4. Heart in White
          _buildNavItem(
            icon: Icons.favorite_border_rounded,
            color: Colors.white.withValues(alpha: 0.9),
            onTap: () {},
          ),
          // 5. Profile in White
          _buildNavItem(
            icon: Icons.person_outline_rounded,
            color: Colors.white.withValues(alpha: 0.9),
            onTap: () => context.push('/profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Icon(
          icon,
          size: 22,
          color: color,
        ),
      ),
    );
  }
}
