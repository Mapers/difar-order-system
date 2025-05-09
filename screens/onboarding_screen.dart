import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  bool isLastPage = false;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('first_time', false);
    
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: const EdgeInsets.only(bottom: 80),
        child: PageView(
          controller: _pageController,
          onPageChanged: (index) {
            setState(() {
              isLastPage = index == 2;
            });
          },
          children: [
            _buildOnboardingPage(
              title: 'Bienvenido a DIFAR CHIMBOTE',
              description: 'Sistema de gestión de pedidos diseñado para optimizar tu trabajo diario.',
              image: Icons.shopping_cart,
              color: const Color(0xFF3B82F6),
            ),
            _buildOnboardingPage(
              title: 'Gestiona tus Pedidos',
              description: 'Crea, visualiza y administra pedidos de manera sencilla y eficiente.',
              image: Icons.description,
              color: const Color(0xFF6366F1),
            ),
            _buildOnboardingPage(
              title: 'Todo en un Solo Lugar',
              description: 'Accede a clientes, productos y pedidos desde cualquier dispositivo.',
              image: Icons.devices,
              color: const Color(0xFF8B5CF6),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        height: 80,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Skip button
            TextButton(
              onPressed: _completeOnboarding,
              child: const Text('Omitir'),
            ),
            
            // Indicator
            Center(
              child: SmoothPageIndicator(
                controller: _pageController,
                count: 3,
                effect: const WormEffect(
                  spacing: 16,
                  dotColor: Colors.black12,
                  activeDotColor: Color(0xFF3B82F6),
                ),
                onDotClicked: (index) => _pageController.animateToPage(
                  index,
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeInOut,
                ),
              ),
            ),
            
            // Next or Done button
            isLastPage
                ? TextButton(
                    onPressed: _completeOnboarding,
                    child: const Text('Comenzar'),
                  )
                : TextButton(
                    onPressed: () {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 500),
                        curve: Curves.easeInOut,
                      );
                    },
                    child: const Text('Siguiente'),
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildOnboardingPage({
    required String title,
    required String description,
    required IconData image,
    required Color color,
  }) {
    return Container(
      color: Colors.white,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              image,
              size: 100,
              color: color,
            ),
          ),
          const SizedBox(height: 64),
          Text(
            title,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              description,
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

