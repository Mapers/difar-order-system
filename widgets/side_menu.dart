import 'package:flutter/material.dart';

class SideMenu extends StatelessWidget {
  final int selectedIndex;

  const SideMenu({Key? key, required this.selectedIndex}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      color: Colors.white,
      child: Column(
        children: [
          // Logo header
          Container(
            height: 80,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 2,
                ),
              ],
            ),
            child: Row(
              children: [
                Image.network(
                  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4PCl6Z3X7LC9rMlLj2kiXPe5RImE88.png',
                  height: 60,
                ),
              ],
            ),
          ),
          
          // Menu items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildMenuItem(
                  context: context,
                  title: 'Dashboard',
                  icon: Icons.home,
                  index: 0,
                  route: '/dashboard',
                ),
                _buildMenuItem(
                  context: context,
                  title: 'Clientes',
                  icon: Icons.people,
                  index: 1,
                  route: '/clientes',
                ),
                _buildMenuItem(
                  context: context,
                  title: 'Productos',
                  icon: Icons.inventory_2,
                  index: 2,
                  route: '/productos',
                ),
                _buildMenuItem(
                  context: context,
                  title: 'Tomar Pedido',
                  icon: Icons.shopping_cart,
                  index: 3,
                  route: '/tomar-pedido',
                ),
                _buildMenuItem(
                  context: context,
                  title: 'Mis Pedidos',
                  icon: Icons.description,
                  index: 4,
                  route: '/mis-pedidos',
                ),
              ],
            ),
          ),
          
          // Logout button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Colors.grey.shade200,
                ),
              ),
            ),
            child: InkWell(
              onTap: () {
                Navigator.pushReplacementNamed(context, '/');
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFEF4444)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: const [
                    Icon(
                      Icons.logout,
                      size: 18,
                      color: Color(0xFFEF4444),
                    ),
                    SizedBox(width: 12),
                    Text(
                      'Cerrar sesión',
                      style: TextStyle(
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required String title,
    required IconData icon,
    required int index,
    required String route,
  }) {
    final bool isSelected = selectedIndex == index;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: InkWell(
        onTap: () {
          if (!isSelected) {
            Navigator.pushReplacementNamed(context, route);
          }
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            gradient: isSelected
                ? const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                  )
                : null,
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? Colors.white : Colors.grey.shade600,
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? Colors.white : Colors.grey.shade800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

