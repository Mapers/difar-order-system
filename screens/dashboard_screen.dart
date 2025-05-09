import 'package:flutter/material.dart';
import '../widgets/side_menu.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Side menu for larger screens
          MediaQuery.of(context).size.width > 600
              ? const SideMenu(selectedIndex: 0)
              : const SizedBox(),
          
          // Main content
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFEFF6FF), // blue-50
                    Color(0xFFEEF2FF), // indigo-50
                  ],
                ),
              ),
              child: Column(
                children: [
                  // Mobile app bar
                  MediaQuery.of(context).size.width <= 600
                      ? AppBar(
                          title: Image.network(
                            'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4PCl6Z3X7LC9rMlLj2kiXPe5RImE88.png',
                            height: 40,
                          ),
                          actions: [
                            Builder(
                              builder: (context) => IconButton(
                                icon: const Icon(Icons.menu),
                                onPressed: () {
                                  Scaffold.of(context).openDrawer();
                                },
                              ),
                            ),
                          ],
                        )
                      : const SizedBox(),
                  
                  // Dashboard content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Panel de Control',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Bienvenido al sistema de gestión de pedidos de DIFAR CHIMBOTE.',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          const SizedBox(height: 24),
                          
                          // Stats cards
                          GridView.count(
                            crossAxisCount: MediaQuery.of(context).size.width > 1200
                                ? 4
                                : MediaQuery.of(context).size.width > 800
                                    ? 2
                                    : 1,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              _buildStatCard(
                                title: 'Pedidos',
                                value: '24',
                                subtitle: '12 pedidos nuevos hoy',
                                icon: Icons.trending_up,
                                gradientColors: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
                              ),
                              _buildStatCard(
                                title: 'Clientes',
                                value: '156',
                                subtitle: '3 clientes nuevos este mes',
                                icon: Icons.people,
                                gradientColors: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
                              ),
                              _buildStatCard(
                                title: 'Productos',
                                value: '89',
                                subtitle: '5 productos actualizados',
                                icon: Icons.inventory_2,
                                gradientColors: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                              ),
                              _buildStatCard(
                                title: 'Actividad',
                                value: 'Hoy',
                                subtitle: 'Última actualización: 10:45 AM',
                                icon: Icons.calendar_today,
                                gradientColors: const [Color(0xFF06B6D4), Color(0xFF0891B2)],
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Action cards
                          GridView.count(
                            crossAxisCount: MediaQuery.of(context).size.width > 1000
                                ? 3
                                : MediaQuery.of(context).size.width > 600
                                    ? 2
                                    : 1,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 3,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              _buildActionCard(
                                title: 'Clientes',
                                description: 'Gestionar lista de clientes y sus datos',
                                icon: Icons.people,
                                color: const Color(0xFF3B82F6),
                                onTap: () {},
                              ),
                              _buildActionCard(
                                title: 'Productos',
                                description: 'Ver y gestionar catálogo de productos',
                                icon: Icons.inventory_2,
                                color: const Color(0xFF6366F1),
                                onTap: () {},
                              ),
                              _buildActionCard(
                                title: 'Tomar Pedido',
                                description: 'Crear y gestionar nuevos pedidos',
                                icon: Icons.shopping_cart,
                                color: const Color(0xFF8B5CF6),
                                onTap: () {},
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Mis Pedidos card
                          InkWell(
                            onTap: () {
                              Navigator.pushNamed(context, '/mis-pedidos');
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Card(
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.description,
                                      size: 24,
                                      color: const Color(0xFF0D9488),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Mis Pedidos',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF0F766E),
                                            ),
                                          ),
                                          Text(
                                            'Ver historial de pedidos enviados',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(
                                      Icons.arrow_forward_ios,
                                      size: 16,
                                      color: Colors.grey[400],
                                    ),
                                  ],
                                ),
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
          ),
        ],
      ),
      // Drawer for mobile
      drawer: MediaQuery.of(context).size.width <= 600
          ? const Drawer(
              child: SideMenu(selectedIndex: 0),
            )
          : null,
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required List<Color> gradientColors,
  }) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Icon(
                  icon,
                  color: Colors.white.withOpacity(0.8),
                  size: 32,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Icon(
                icon,
                size: 24,
                color: color,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

