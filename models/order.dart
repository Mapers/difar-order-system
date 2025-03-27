class Order {
  final String id;
  final String fecha;
  final String cliente;
  final String condicion;
  final double total;
  final String estado;
  final String moneda;

  Order({
    required this.id,
    required this.fecha,
    required this.cliente,
    required this.condicion,
    required this.total,
    required this.estado,
    required this.moneda,
  });
}

