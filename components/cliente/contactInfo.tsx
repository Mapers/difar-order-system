import React, { useState } from 'react';
import { Phone, User, MapPin, Navigation, ChevronDown } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import { IClient } from '@/interface/order/client-interface';

interface ClientRowProps {
  client: IClient;
  referenciaDireccion: string;
  contactoPedido: string;
  onChangeReferenciaDireccion: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeContactoPedido: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContactInfo: React.FC<ClientRowProps> = ({ client, referenciaDireccion, contactoPedido, onChangeContactoPedido, onChangeReferenciaDireccion }) => {

  const [showFullDireccion, setShowFullDireccion] = useState(false);

  const renderDireccion = () => {
    const isLong = client.Dirección?.length > 20;
    const text = showFullDireccion || !isLong
      ? client.Dirección
      : client.Dirección?.slice(0, 20) + '...';

    return (
      <p className="text-sm text-gray-900 flex items-center gap-1">
        {text}
        {isLong && (
          <button
            onClick={() => setShowFullDireccion(!showFullDireccion)}
            className="ml-1 text-gray-600 hover:text-black"
            type="button"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFullDireccion ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </p>
    );
  };

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
              <p className="text-sm text-gray-900">{client.telefono ?? '+51 ---------'}</p>
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
              onChange={onChangeContactoPedido}
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
              {renderDireccion()}
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
              onChange={onChangeReferenciaDireccion}
              placeholder="Ej: Frente al parque, casa azul..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
