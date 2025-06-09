import React, { useState } from 'react';
import { Phone, User, MapPin, Navigation } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import { IClient } from '@/interface/client/client-interface';

interface ClientRowProps {
  client: IClient;
}

const ContactInfo: React.FC<ClientRowProps> = ({ client }) => {
  const [contactoPedido, setContactoPedido] = useState('');
  const [referenciaDireccion, setReferenciaDireccion] = useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-600" />
          Información de Contacto
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
              <p className="text-sm text-gray-900">{client.telefono}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactoPedido" className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Persona de Contacto
            </Label>
            <Input
              id="contactoPedido"
              value={contactoPedido}
              onChange={(e) => setContactoPedido(e.target.value)}
              placeholder="Nombre de la persona de contacto (opcional)"
            />
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" />
          Información de Entrega
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <Label className="text-sm font-medium text-gray-700">Dirección</Label>
              <p className="text-sm text-gray-900">{client.Dirección}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenciaDireccion" className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-green-600" />
              Referencia de Ubicación
            </Label>
            <Input
              id="referenciaDireccion"
              value={referenciaDireccion}
              onChange={(e) => setReferenciaDireccion(e.target.value)}
              placeholder="Ej: Frente al parque, casa azul..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
