import React, { useState } from 'react';
import {Phone, User, MapPin, Navigation, ChevronDown, Edit, Save, X} from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import { IClient } from '@/interface/order/client-interface';

interface ClientRowProps {
  client: IClient;
  referenciaDireccion: string;
  contactoPedido: string;
  onChangeReferenciaDireccion: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeContactoPedido: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateClient?: (updatedFields: { telefono?: string; Dirección?: string }) => void;
}

const ContactInfo: React.FC<ClientRowProps> = ({
                                                 client,
                                                 referenciaDireccion,
                                                 contactoPedido,
                                                 onChangeContactoPedido,
                                                 onChangeReferenciaDireccion,
                                                 onUpdateClient
}) => {

  const [showFullDireccion, setShowFullDireccion] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedPhone, setEditedPhone] = useState(client?.telefono ?? '');
  const [editedAddress, setEditedAddress] = useState(client?.Dirección ?? '');

  const handleSavePhone = () => {
    if (onUpdateClient) {
      onUpdateClient({ telefono: editedPhone });
    }
    setIsEditingPhone(false);
  };

  const handleSaveAddress = () => {
    if (onUpdateClient) {
      onUpdateClient({ Dirección: editedAddress });
    }
    setIsEditingAddress(false);
  };

  const handleCancelEdit = (field: 'phone' | 'address') => {
    if (field === 'phone') {
      setEditedPhone(client?.telefono ?? '');
      setIsEditingPhone(false);
    } else {
      setEditedAddress(client?.Dirección ?? '');
      setIsEditingAddress(false);
    }
  };

  const renderEditableDireccion = () => {
    const isLong = editedAddress?.length > 20;
    const text = showFullDireccion || !isLong
        ? editedAddress
        : editedAddress?.slice(0, 20) + '...';

    return (
        <div className="flex items-center gap-1">
          {isEditingAddress ? (
              <textarea
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="w-full p-2 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                  placeholder="Ingrese la dirección"
                  rows={3}
                  autoFocus
              />
          ) : (
              <>
                <p className="text-sm text-gray-900">{text}</p>
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
              </>
          )}
        </div>
    );
  };

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
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Teléfono
              </Label>
              {!isEditingPhone ? (
                  <button
                      onClick={() => setIsEditingPhone(true)}
                      className="p-1 hover:bg-blue-200 rounded transition-colors"
                      type="button"
                  >
                    <Edit className="w-3 h-3 text-blue-600"/>
                  </button>
              ) : (
                  <div className="flex gap-1">
                    <button
                        onClick={handleSavePhone}
                        className="p-1 hover:bg-green-200 rounded transition-colors"
                        type="button"
                    >
                      <Save className="w-3 h-3 text-green-600"/>
                    </button>
                    <button
                        onClick={() => handleCancelEdit('phone')}
                        className="p-1 hover:bg-red-200 rounded transition-colors"
                        type="button"
                    >
                      <X className="w-3 h-3 text-red-600"/>
                    </button>
                  </div>
              )}
            </div>

            {isEditingPhone ? (
                <input
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full p-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ingrese el teléfono"
                    autoFocus
                />
            ) : (
                <p className="text-sm text-gray-900">{client.telefono ?? '+51 ---------'}</p>
            )}
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
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Dirección
              </Label>
              {!isEditingAddress ? (
                  <button
                      onClick={() => setIsEditingAddress(true)}
                      className="p-1 hover:bg-green-200 rounded transition-colors flex-shrink-0"
                      type="button"
                  >
                    <Edit className="w-3 h-3 text-green-600"/>
                  </button>
              ) : (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={handleSaveAddress}
                        className="p-1 hover:bg-green-200 rounded transition-colors"
                        type="button"
                    >
                      <Save className="w-3 h-3 text-green-600"/>
                    </button>
                    <button
                        onClick={() => handleCancelEdit('address')}
                        className="p-1 hover:bg-red-200 rounded transition-colors"
                        type="button"
                    >
                      <X className="w-3 h-3 text-red-600"/>
                    </button>
                  </div>
              )}
            </div>

            {isEditingAddress ? (
                renderEditableDireccion()
            ) : (
                renderDireccion()
            )}
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
