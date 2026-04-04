import React, { useState } from 'react';
import {Phone, User, MapPin, Navigation, ChevronDown, Edit, Save, X} from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import { IClient } from '@/app/types/order/client-interface';

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
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          {isEditingAddress ? (
              <textarea
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="w-full p-2 text-sm border border-green-300 dark:border-green-700 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none bg-white dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ingrese la dirección"
                  rows={3}
                  autoFocus
              />
          ) : (
              <>
                <p className="text-sm text-gray-900 dark:text-gray-100">{text}</p>
                {isLong && (
                    <button
                        onClick={() => setShowFullDireccion(!showFullDireccion)}
                        className="ml-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-gray-100"
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
      <p className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
        {text}
        {isLong && (
          <button
            onClick={() => setShowFullDireccion(!showFullDireccion)}
            className="ml-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-gray-100"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Información de Contacto
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Teléfono
              </Label>
              {!isEditingPhone ? (
                  <button
                      onClick={() => setIsEditingPhone(true)}
                      className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900/40 rounded transition-colors"
                      type="button"
                  >
                    <Edit className="w-3 h-3 text-blue-600 dark:text-blue-400"/>
                  </button>
              ) : (
                  <div className="flex gap-1">
                    <button
                        onClick={handleSavePhone}
                        className="p-1 hover:bg-green-200 dark:hover:bg-green-900/40 rounded transition-colors"
                        type="button"
                    >
                      <Save className="w-3 h-3 text-green-600 dark:text-green-400"/>
                    </button>
                    <button
                        onClick={() => handleCancelEdit('phone')}
                        className="p-1 hover:bg-red-200 dark:hover:bg-red-900/40 rounded transition-colors"
                        type="button"
                    >
                      <X className="w-3 h-3 text-red-600 dark:text-red-400"/>
                    </button>
                  </div>
              )}
            </div>

            {isEditingPhone ? (
                <input
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full p-2 text-sm border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Ingrese el teléfono"
                    autoFocus
                />
            ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{client.telefono ?? '+51 ---------'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactoPedido" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Persona de Contacto
            </Label>
            <Input
              id="contactoPedido"
              value={contactoPedido}
              onChange={onChangeContactoPedido}
              placeholder="Nombre de la persona de contacto (opcional)"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
          Información de Entrega
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                Dirección
              </Label>
              {!isEditingAddress ? (
                  <button
                      onClick={() => setIsEditingAddress(true)}
                      className="p-1 hover:bg-green-200 dark:hover:bg-green-900/40 rounded transition-colors flex-shrink-0"
                      type="button"
                  >
                    <Edit className="w-3 h-3 text-green-600 dark:text-green-400"/>
                  </button>
              ) : (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={handleSaveAddress}
                        className="p-1 hover:bg-green-200 dark:hover:bg-green-900/40 rounded transition-colors"
                        type="button"
                    >
                      <Save className="w-3 h-3 text-green-600 dark:text-green-400"/>
                    </button>
                    <button
                        onClick={() => handleCancelEdit('address')}
                        className="p-1 hover:bg-red-200 dark:hover:bg-red-900/40 rounded transition-colors"
                        type="button"
                    >
                      <X className="w-3 h-3 text-red-600 dark:text-red-400"/>
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
            <Label htmlFor="referenciaDireccion" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Navigation className="w-4 h-4 text-green-600 dark:text-green-400" />
              Referencia de Ubicación
            </Label>
            <Input
              id="referenciaDireccion"
              value={referenciaDireccion}
              onChange={onChangeReferenciaDireccion}
              placeholder="Ej: Frente al parque, casa azul..."
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
