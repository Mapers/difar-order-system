import 'package:flutter/material.dart';
import '../widgets/side_menu.dart';

class DetallePedidoScreen extends StatelessWidget {
  const DetallePedidoScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final String orderId = ModalRoute.of(context)?.settings.arguments as String? ?? 'PED-001';
    final bool isDesktop = MediaQuery.of(context).size.width > 600;
    
    // Mock data for order details
    final orderDetails = {
      'id': orderId,
      'fecha': '2023-05-15',
      'cliente': {
        'nombre': 'Cliente 1',
        'codigo': 'C001',
        'direccion': 'Av. Principal 123, Chimbote',
      },
      'condicion': 'Factura',
      'moneda': 'NSO',
      'estado': 'Entregado',
      'items': [
        {'id': 1, 'producto': 'Producto 1', 'cantidad': 2, 'precio': 100.00, 'total': 200.00},
        {'id': 2, 'producto': 'Producto 2', 'cantidad': 5, 'precio': 150.00, 'total': 750.00},
        {'id': 3, 'producto': 'Producto 3', 'cantidad': 2, 'precio': 150.00, 'total': 300.00},
      ],
      'subtotal': 1250.00,
      'igv': 225.00,
      'total': 1475.00,
    };

    return Scaffold(
      body: Row(
        children: [
          // Side menu for larger screens
          isDesktop ? const SideMenu(selectedIndex: 4) : const SizedBox(),
          
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
                  !isDesktop
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
                  
                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header with back button
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.arrow_back),
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                iconSize: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Pedido #${orderDetails['id']}',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF111827),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Información completa del pedido y sus productos.',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Action buttons
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              OutlinedButton.icon(
                                onPressed: () {},
                                icon: const Icon(Icons.print),
                                label: Text(isDesktop ? 'Imprimir' : ''),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              OutlinedButton.icon(
                                onPressed: () {},
                                icon: const Icon(Icons.download),
                                label: Text(isDesktop ? 'Descargar PDF' : ''),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Order and client info cards
                          GridView.count(
                            crossAxisCount: isDesktop ? 2 : 1,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: isDesktop ? 3 : 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              // Order info card
                              Card(
                                elevation: 2,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade50,
                                        borderRadius: const BorderRadius.only(
                                          topLeft: Radius.circular(12),
                                          topRight: Radius.circular(12),
                                        ),
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Colors.grey.shade200,
                                          ),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Text(
                                            'Información del Pedido',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF0F766E),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: GridView.count(
                                          crossAxisCount: 2,
                                          childAspectRatio: 3,
                                          crossAxisSpacing: 16,
                                          mainAxisSpacing: 16,
                                          shrinkWrap: true,
                                          physics: const NeverScrollableScrollPhysics(),
                                          children: [
                                            _buildInfoItem(
                                              'Número de Pedido:',
                                              orderDetails['id'] as String,
                                              isBold: true,
                                            ),
                                            _buildInfoItem(
                                              'Fecha:',
                                              _formatDate(orderDetails['fecha'] as String),
                                            ),
                                            _buildInfoItem(
                                              'Condición:',
                                              orderDetails['condicion'] as String,
                                            ),
                                            _buildInfoItem(
                                              'Moneda:',
                                              orderDetails['moneda'] == 'NSO'
                                                  ? 'Soles (S/.)'
                                                  : 'Dólares (\$)',
                                            ),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'Estado:',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey.shade600,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                _buildStatusBadge(orderDetails['estado'] as String),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              
                              // Client info card
                              Card(
                                elevation: 2,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade50,
                                        borderRadius: const BorderRadius.only(
                                          topLeft: Radius.circular(12),
                                          topRight: Radius.circular(12),
                                        ),
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Colors.grey.shade200,
                                          ),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Text(
                                            'Información del Cliente',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF0F766E),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            _buildInfoItem(
                                              'Cliente:',
                                              (orderDetails['cliente'] as Map)['nombre'] as String,
                                              isBold: true,
                                            ),
                                            const SizedBox(height: 12),
                                            _buildInfoItem(
                                              'Código:',
                                              (orderDetails['cliente'] as Map)['codigo'] as String,
                                            ),
                                            const SizedBox(height: 12),
                                            _buildInfoItem(
                                              'Dirección:',
                                              (orderDetails['cliente'] as Map)['direccion'] as String,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Products card
                          Card(
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(12),
                                      topRight: Radius.circular(12),
                                    ),
                                    border: Border(
                                      bottom: BorderSide(
                                        color: Colors.grey.shade200,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Text(
                                        'Productos',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF0F766E),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: isDesktop
                                      ? _buildProductsTable(orderDetails)
                                      : _buildProductsCards(orderDetails),
                                ),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: const BorderRadius.only(
                                      bottomLeft: Radius.circular(12),
                                      bottomRight: Radius.circular(12),
                                    ),
                                    border: Border(
                                      top: BorderSide(
                                        color: Colors.grey.shade200,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      SizedBox(
                                        width: 200,
                                        child: Column(
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  'Subtotal:',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w500,
                                                    color: Colors.grey.shade700,
                                                  ),
                                                ),
                                                Text(
                                                  '${(orderDetails['subtotal'] as double).toStringAsFixed(2)} ${orderDetails['moneda'] == 'NSO' ? 'S/.' : '\$'}',
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  'IGV (18%):',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w500,
                                                    color: Colors.grey.shade700,
                                                  ),
                                                ),
                                                Text(
                                                  '${(orderDetails['igv'] as double).toStringAsFixed(2)} ${orderDetails['moneda'] == 'NSO' ? 'S/.' : '\$'}',
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            const Divider(),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                const Text(
                                                  'Total:',
                                                  style: TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF0F766E),
                                                  ),
                                                ),
                                                Text(
                                                  '${(orderDetails['total'] as double).toStringAsFixed(2)} ${orderDetails['moneda'] == 'NSO' ? 'S/.' : '\$'}',
                                                  style: const TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF0F766E),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
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
      drawer: !isDesktop
          ? const Drawer(
              child: SideMenu(selectedIndex: 4),
            )
          : null,
    );
  }

  Widget _buildInfoItem(String label, String value, {bool isBold = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ],
    );
  }

  Widget _buildProductsTable(Map<String, dynamic> orderDetails) {
    final items = orderDetails['items'] as List;
    final moneda = orderDetails['moneda'] as String;
    
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(Colors.grey.shade50),
          dataRowHeight: 56,
          columns: const [
            DataColumn(label: Text('Producto')),
            DataColumn(
              label: Text('Cantidad'),
              numeric: true,
            ),
            DataColumn(
              label: Text('Precio Unitario'),
              numeric: true,
            ),
            DataColumn(
              label: Text('Total'),
              numeric: true,
            ),
          ],
          rows: items.map<DataRow>((item) {
            return DataRow(
              cells: [
                DataCell(Text(item['producto'] as String)),
                DataCell(
                  Text(item['cantidad'].toString()),
                  numeric: true,
                ),
                DataCell(
                  Text(
                    '${(item['precio'] as double).toStringAsFixed(2)} ${moneda == 'NSO' ? 'S/.' : '\$'}',
                  ),
                  numeric: true,
                ),
                DataCell(
                  Text(
                    '${(item['total'] as double).toStringAsFixed(2)} ${moneda == 'NSO' ? 'S/.' : '\$'}',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  numeric: true,
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildProductsCards(Map<String, dynamic> orderDetails) {
    final items = orderDetails['items'] as List;
    final moneda = orderDetails['moneda'] as String;
    
    return Column(
      children: items.map<Widget>((item) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item['producto'] as String,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cantidad:',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item['cantidad'].toString(),
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Precio:',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${(item['precio'] as double).toStringAsFixed(2)} ${moneda == 'NSO' ? 'S/.' : '\$'}',
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total:',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${(item['total'] as double).toStringAsFixed(2)} ${moneda == 'NSO' ? 'S/.' : '\$'}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F766E),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status) {
      case 'Entregado':
        backgroundColor = const Color(0xFFDCFCE7);
        textColor = const Color(0xFF166534);
        break;
      case 'En proceso':
        backgroundColor = const Color(0xFFDBEAFE);
        textColor = const Color(0xFF1E40AF);
        break;
      case 'Pendiente':
        backgroundColor = const Color(0xFFFEF3C7);
        textColor = const Color(0xFF92400E);
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade800;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    final parts = dateStr.split('-');
    return '${parts[2]}/${parts[1]}/${parts[0]}';
  }
}

