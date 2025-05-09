import 'package:flutter/material.dart';
import '../widgets/side_menu.dart';
import '../models/order.dart';

class MisPedidosScreen extends StatefulWidget {
  const MisPedidosScreen({Key? key}) : super(key: key);

  @override
  State<MisPedidosScreen> createState() => _MisPedidosScreenState();
}

class _MisPedidosScreenState extends State<MisPedidosScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _statusFilter = 'todos';
  DateTime? _dateFrom;
  DateTime? _dateTo;

  // Mock data
  final List<Order> _orders = [
    Order(
      id: 'PED-001',
      fecha: '2023-05-15',
      cliente: 'Cliente 1',
      condicion: 'Factura',
      total: 1250.00,
      estado: 'Entregado',
      moneda: 'NSO',
    ),
    Order(
      id: 'PED-002',
      fecha: '2023-05-18',
      cliente: 'Cliente 3',
      condicion: 'Crédito',
      total: 850.50,
      estado: 'En proceso',
      moneda: 'NSO',
    ),
    Order(
      id: 'PED-003',
      fecha: '2023-05-20',
      cliente: 'Cliente 2',
      condicion: 'Boleta',
      total: 320.75,
      estado: 'Entregado',
      moneda: 'NSO',
    ),
    Order(
      id: 'PED-004',
      fecha: '2023-05-22',
      cliente: 'Cliente 5',
      condicion: 'Factura',
      total: 1500.00,
      estado: 'Pendiente',
      moneda: 'USD',
    ),
    Order(
      id: 'PED-005',
      fecha: '2023-05-25',
      cliente: 'Cliente 4',
      condicion: 'Crédito',
      total: 980.25,
      estado: 'Entregado',
      moneda: 'NSO',
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = MediaQuery.of(context).size.width > 600;

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
                          const Text(
                            'Mis Pedidos',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Historial de pedidos enviados y su estado actual.',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          const SizedBox(height: 24),
                          
                          // Orders card
                          Card(
                            elevation: 3,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header
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
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            'Historial de Pedidos',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF0F766E),
                                            ),
                                          ),
                                          const Spacer(),
                                          if (isDesktop) ...[
                                            SizedBox(
                                              width: 200,
                                              child: TextField(
                                                controller: _searchController,
                                                decoration: InputDecoration(
                                                  hintText: 'Buscar pedidos...',
                                                  prefixIcon: const Icon(Icons.search, size: 20),
                                                  contentPadding: EdgeInsets.zero,
                                                  border: OutlineInputBorder(
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  filled: true,
                                                  fillColor: Colors.white,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            SizedBox(
                                              width: 120,
                                              child: DropdownButtonFormField<String>(
                                                value: _statusFilter,
                                                decoration: InputDecoration(
                                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                                                  border: OutlineInputBorder(
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  filled: true,
                                                  fillColor: Colors.white,
                                                ),
                                                items: const [
                                                  DropdownMenuItem(
                                                    value: 'todos',
                                                    child: Text('Todos'),
                                                  ),
                                                  DropdownMenuItem(
                                                    value: 'entregado',
                                                    child: Text('Entregados'),
                                                  ),
                                                  DropdownMenuItem(
                                                    value: 'proceso',
                                                    child: Text('En proceso'),
                                                  ),
                                                  DropdownMenuItem(
                                                    value: 'pendiente',
                                                    child: Text('Pendientes'),
                                                  ),
                                                ],
                                                onChanged: (value) {
                                                  setState(() {
                                                    _statusFilter = value!;
                                                  });
                                                },
                                              ),
                                            ),
                                          ],
                                          if (!isDesktop) ...[
                                            IconButton(
                                              icon: const Icon(Icons.search),
                                              onPressed: () {
                                                // Show search dialog
                                              },
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.filter_list),
                                              onPressed: () {
                                                // Show filter dialog
                                              },
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                
                                // Filter section
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (!isDesktop) ...[
                                        TextField(
                                          controller: _searchController,
                                          decoration: InputDecoration(
                                            hintText: 'Buscar pedidos...',
                                            prefixIcon: const Icon(Icons.search, size: 20),
                                            contentPadding: EdgeInsets.zero,
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            filled: true,
                                            fillColor: Colors.white,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        DropdownButtonFormField<String>(
                                          value: _statusFilter,
                                          decoration: InputDecoration(
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            filled: true,
                                            fillColor: Colors.white,
                                          ),
                                          items: const [
                                            DropdownMenuItem(
                                              value: 'todos',
                                              child: Text('Todos'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'entregado',
                                              child: Text('Entregados'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'proceso',
                                              child: Text('En proceso'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'pendiente',
                                              child: Text('Pendientes'),
                                            ),
                                          ],
                                          onChanged: (value) {
                                            setState(() {
                                              _statusFilter = value!;
                                            });
                                          },
                                        ),
                                        const SizedBox(height: 16),
                                      ],
                                      
                                      // Date filters
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text(
                                                  'Desde',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.w500,
                                                    color: Color(0xFF374151),
                                                  ),
                                                ),
                                                const SizedBox(height: 8),
                                                InkWell(
                                                  onTap: () async {
                                                    final DateTime? picked = await showDatePicker(
                                                      context: context,
                                                      initialDate: _dateFrom ?? DateTime.now(),
                                                      firstDate: DateTime(2020),
                                                      lastDate: DateTime(2025),
                                                    );
                                                    if (picked != null) {
                                                      setState(() {
                                                        _dateFrom = picked;
                                                      });
                                                    }
                                                  },
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                                    decoration: BoxDecoration(
                                                      border: Border.all(color: Colors.grey.shade300),
                                                      borderRadius: BorderRadius.circular(8),
                                                      color: Colors.white,
                                                    ),
                                                    child: Row(
                                                      children: [
                                                        Icon(
                                                          Icons.calendar_today,
                                                          size: 16,
                                                          color: Colors.grey.shade600,
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Text(
                                                          _dateFrom == null
                                                              ? 'Seleccionar fecha'
                                                              : '${_dateFrom!.day}/${_dateFrom!.month}/${_dateFrom!.year}',
                                                          style: TextStyle(
                                                            color: _dateFrom == null
                                                                ? Colors.grey.shade600
                                                                : Colors.black87,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text(
                                                  'Hasta',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.w500,
                                                    color: Color(0xFF374151),
                                                  ),
                                                ),
                                                const SizedBox(height: 8),
                                                InkWell(
                                                  onTap: () async {
                                                    final DateTime? picked = await showDatePicker(
                                                      context: context,
                                                      initialDate: _dateTo ?? DateTime.now(),
                                                      firstDate: DateTime(2020),
                                                      lastDate: DateTime(2025),
                                                    );
                                                    if (picked != null) {
                                                      setState(() {
                                                        _dateTo = picked;
                                                      });
                                                    }
                                                  },
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                                    decoration: BoxDecoration(
                                                      border: Border.all(color: Colors.grey.shade300),
                                                      borderRadius: BorderRadius.circular(8),
                                                      color: Colors.white,
                                                    ),
                                                    child: Row(
                                                      children: [
                                                        Icon(
                                                          Icons.calendar_today,
                                                          size: 16,
                                                          color: Colors.grey.shade600,
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Text(
                                                          _dateTo == null
                                                              ? 'Seleccionar fecha'
                                                              : '${_dateTo!.day}/${_dateTo!.month}/${_dateTo!.year}',
                                                          style: TextStyle(
                                                            color: _dateTo == null
                                                                ? Colors.grey.shade600
                                                                : Colors.black87,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const SizedBox(height: 24),
                                                SizedBox(
                                                  width: double.infinity,
                                                  child: ElevatedButton(
                                                    onPressed: () {
                                                      // Apply filters
                                                    },
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: const Color(0xFF0D9488),
                                                      foregroundColor: Colors.white,
                                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(8),
                                                      ),
                                                    ),
                                                    child: const Text('Filtrar'),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                
                                // Orders list
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                  child: isDesktop
                                      ? _buildOrdersTable()
                                      : _buildOrdersCards(),
                                ),
                                
                                // Pagination
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Text(
                                        'Mostrando 5 de 24 pedidos',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                      const Spacer(),
                                      OutlinedButton(
                                        onPressed: null,
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          side: BorderSide(color: Colors.grey.shade300),
                                        ),
                                        child: const Text('Anterior'),
                                      ),
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        onPressed: () {},
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          side: BorderSide(color: Colors.grey.shade300),
                                        ),
                                        child: const Text('Siguiente'),
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

  Widget _buildOrdersTable() {
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
            DataColumn(label: Text('Pedido')),
            DataColumn(label: Text('Fecha')),
            DataColumn(label: Text('Cliente')),
            DataColumn(label: Text('Condición')),
            DataColumn(
              label: Text('Total'),
              numeric: true,
            ),
            DataColumn(label: Text('Estado')),
            DataColumn(
              label: Text('Acciones'),
              numeric: true,
            ),
          ],
          rows: _orders.map((order) {
            return DataRow(
              cells: [
                DataCell(Text(
                  order.id,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                )),
                DataCell(Text(_formatDate(order.fecha))),
                DataCell(Text(order.cliente)),
                DataCell(Text(order.condicion)),
                DataCell(
                  Text(
                    '${order.total.toStringAsFixed(2)} ${order.moneda == "NSO" ? "S/." : "\$"}',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  numeric: true,
                ),
                DataCell(_buildStatusBadge(order.estado)),
                DataCell(
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.visibility, size: 18),
                        color: const Color(0xFF0D9488),
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            '/detalle-pedido',
                            arguments: order.id,
                          );
                        },
                        tooltip: 'Ver detalles',
                      ),
                      IconButton(
                        icon: const Icon(Icons.print, size: 18),
                        color: const Color(0xFF3B82F6),
                        onPressed: () {},
                        tooltip: 'Imprimir',
                      ),
                      IconButton(
                        icon: const Icon(Icons.download, size: 18),
                        color: const Color(0xFF6366F1),
                        onPressed: () {},
                        tooltip: 'Descargar',
                      ),
                    ],
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildOrdersCards() {
    return Column(
      children: _orders.map((order) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(8),
                    topRight: Radius.circular(8),
                  ),
                  border: Border(
                    bottom: BorderSide(color: Colors.grey.shade200),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order.id,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    _buildStatusBadge(order.estado),
                  ],
                ),
              ),
              
              // Content
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Fecha:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatDate(order.fecha),
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
                                'Cliente:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                order.cliente,
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
                                'Condición:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                order.condicion,
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
                                'Total:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${order.total.toStringAsFixed(2)} ${order.moneda == "NSO" ? "S/." : "\$"}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF0D9488),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Actions
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: Colors.grey.shade200),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          '/detalle-pedido',
                          arguments: order.id,
                        );
                      },
                      icon: const Icon(
                        Icons.visibility,
                        size: 18,
                        color: Color(0xFF0D9488),
                      ),
                      label: const Text(
                        'Ver',
                        style: TextStyle(color: Color(0xFF0D9488)),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () {},
                      icon: const Icon(
                        Icons.print,
                        size: 18,
                        color: Color(0xFF3B82F6),
                      ),
                      label: const Text(
                        'Imprimir',
                        style: TextStyle(color: Color(0xFF3B82F6)),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () {},
                      icon: const Icon(
                        Icons.download,
                        size: 18,
                        color: Color(0xFF6366F1),
                      ),
                      label: const Text(
                        'PDF',
                        style: TextStyle(color: Color(0xFF6366F1)),
                      ),
                    ),
                  ],
                ),
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

