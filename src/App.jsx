import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, DollarSign, Users, Package, ShoppingCart, X, UserPlus, FileText, Receipt, ChevronDown, ChevronRight, LogOut, CreditCard } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";


// Configuración de Firebase
// Para un despliegue real (como en Vercel), estas claves deben ser reemplazadas por variables de entorno.
const firebaseConfig = {
  apiKey: "AIzaSyC_o19HSoXgqV4Dqgk2W4nrkuN8OZySFsg",
  authDomain: "al-lapiz.firebaseapp.com",
  projectId: "al-lapiz",
  storageBucket: "al-lapiz.firebasestorage.app",
  messagingSenderId: "779062905126",
  appId: "1:779062905126:web:0453014a6554dd79fd99e7",
  measurementId: "G-YEDT97L3Y7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// Helper para formatear la moneda a CLP sin decimales
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Componente Modal Genérico
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Componente de Modal de Confirmación
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmación"}>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button 
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }} 
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                    Confirmar
                </button>
            </div>
        </Modal>
    );
};

// Componente de Modal de Alerta
const AlertModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "Aviso"}>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    Aceptar
                </button>
            </div>
        </Modal>
    );
};


// Componente Dashboard
const Dashboard = ({ sales, customers, products }) => {
    const totalRevenue = useMemo(() => 
        sales.reduce((acc, sale) => acc + (sale.total - sale.balance), 0), 
        [sales]
    );
    
    const accountsReceivable = useMemo(() =>
        sales.reduce((acc, sale) => acc + sale.balance, 0),
        [sales]
    );

    const recentSales = useMemo(() => 
        [...sales]
        .filter(sale => sale.date && typeof sale.date.toDate === 'function')
        .sort((a, b) => b.date.toDate() - a.date.toDate()).slice(0, 5),
        [sales]
    );

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Ingresos Totales</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <DollarSign size={40} className="opacity-50" />
                </div>
                 <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Cuentas por Cobrar</p>
                        <p className="text-3xl font-bold">{formatCurrency(accountsReceivable)}</p>
                    </div>
                    <FileText size={40} className="opacity-50" />
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Clientes Totales</p>
                        <p className="text-3xl font-bold">{customers.length}</p>
                    </div>
                    <Users size={40} className="opacity-50" />
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Productos Totales</p>
                        <p className="text-3xl font-bold">{products.length}</p>
                    </div>
                    <Package size={40} className="opacity-50" />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Ventas Recientes</h3>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Cliente</th>
                                    <th className="p-4 font-semibold text-gray-600">Total</th>
                                    <th className="p-4 font-semibold text-gray-600">Saldo</th>
                                    <th className="p-4 font-semibold text-gray-600">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSales.map(sale => (
                                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 text-gray-800">{sale.customerName}</td>
                                        <td className="p-4 text-gray-800">{formatCurrency(sale.total)}</td>
                                        <td className={`p-4 font-medium ${sale.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(sale.balance)}</td>
                                        <td className="p-4 text-gray-600 text-sm">{sale.date ? sale.date.toDate().toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente de Productos
const Products = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', stock: '' });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: () => {} });

    const sortedProducts = useMemo(() => 
        [...products].sort((a, b) => a.name.localeCompare(b.name)), 
        [products]
    );

    const handleOpenModal = (product = null) => {
        if (product) {
            setProductToEdit(product);
            setFormData({
                name: product.name,
                price: product.price,
                stock: product.stock,
            });
        } else {
            setProductToEdit(null);
            setFormData({ name: '', price: '', stock: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setProductToEdit(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const productData = {
            ...formData,
            price: parseInt(formData.price, 10) || 0,
            stock: parseInt(formData.stock, 10) || 0,
        };
        if (productToEdit) {
            onUpdateProduct(productToEdit.id, productData);
        } else {
            onAddProduct(productData);
        }
        handleCloseModal();
    };
    
    const handleDeleteRequest = (id) => {
        setConfirmDelete({
            isOpen: true,
            onConfirm: () => onDeleteProduct(id)
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Añadir Producto
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Nombre</th>
                                <th className="p-4 font-semibold text-gray-600">Precio</th>
                                <th className="p-4 font-semibold text-gray-600">Stock</th>
                                <th className="p-4 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.map(product => (
                                <tr key={product.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 text-gray-800">{product.name}</td>
                                    <td className="p-4 text-gray-800">{formatCurrency(product.price)}</td>
                                    <td className="p-4 text-gray-800">{product.stock}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(product)} className="text-blue-500 hover:text-blue-700"><Edit size={20} /></button>
                                            <button onClick={() => handleDeleteRequest(product.id)} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={productToEdit ? "Editar Producto" : "Añadir Producto"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                        <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required step="1" min="0" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                        <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="0" />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">{productToEdit ? "Guardar Cambios" : "Crear Producto"}</button>
                    </div>
                </form>
            </Modal>
            <ConfirmationModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, onConfirm: () => {} })}
                onConfirm={confirmDelete.onConfirm}
                title="Eliminar Producto"
                message="¿Estás seguro de que quieres eliminar este producto?"
            />
        </div>
    );
};

// Componente de Clientes
const Customers = ({ customers, sales, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onRegisterPayment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: () => {} });

    const customerDebts = useMemo(() => {
        const debts = {};
        sales.forEach(sale => {
            if (sale.balance > 0) {
                debts[sale.customerId] = (debts[sale.customerId] || 0) + sale.balance;
            }
        });
        return debts;
    }, [sales]);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setCustomerToEdit(customer);
            setFormData({
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            });
        } else {
            setCustomerToEdit(null);
            setFormData({ name: '', email: '', phone: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCustomerToEdit(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (customerToEdit) {
            onUpdateCustomer(customerToEdit.id, formData);
        } else {
            onAddCustomer(formData);
        }
        handleCloseModal();
    };
    
    const handleDeleteRequest = (id) => {
        setConfirmDelete({
            isOpen: true,
            onConfirm: () => onDeleteCustomer(id)
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Añadir Cliente
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Nombre</th>
                                <th className="p-4 font-semibold text-gray-600">Email</th>
                                <th className="p-4 font-semibold text-gray-600">Deuda Total</th>
                                <th className="p-4 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(customer => (
                                <tr key={customer.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 text-gray-800">{customer.name}</td>
                                    <td className="p-4 text-gray-800">{customer.email}</td>
                                    <td className={`p-4 font-medium ${customerDebts[customer.id] > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {formatCurrency(customerDebts[customer.id] || 0)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => onRegisterPayment(customer.id)} disabled={!customerDebts[customer.id]} className="text-green-500 hover:text-green-700 disabled:text-gray-300 disabled:cursor-not-allowed" title="Registrar Pago"><DollarSign size={20} /></button>
                                            <button onClick={() => handleOpenModal(customer)} className="text-blue-500 hover:text-blue-700" title="Editar Cliente"><Edit size={20} /></button>
                                            <button onClick={() => handleDeleteRequest(customer.id)} className="text-red-500 hover:text-red-700" title="Eliminar Cliente"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={customerToEdit ? "Editar Cliente" : "Añadir Cliente"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">{customerToEdit ? "Guardar Cambios" : "Crear Cliente"}</button>
                    </div>
                </form>
            </Modal>
            <ConfirmationModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, onConfirm: () => {} })}
                onConfirm={confirmDelete.onConfirm}
                title="Eliminar Cliente"
                message="¿Estás seguro de que quieres eliminar este cliente?"
            />
        </div>
    );
};

// Componente de Ventas
const Sales = ({ sales, customers, products, onAddSale, onAddCustomer, onAddPayment, paymentMethods }) => {
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [saleToPay, setSaleToPay] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [cart, setCart] = useState([]);
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', email: '', phone: '' });
    const [showOnlyPending, setShowOnlyPending] = useState(false);

    const filteredSales = useMemo(() => {
        if (showOnlyPending) {
            return sales.filter(sale => sale.balance > 0);
        }
        return sales;
    }, [sales, showOnlyPending]);

    const handleAddProductToCart = (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const existingCartItem = cart.find(item => item.id === productId);
        if (existingCartItem) {
            setCart(cart.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const handleQuantityChange = (productId, quantity) => {
        const validatedQuantity = isNaN(quantity) ? 1 : quantity;
        const newQuantity = Math.max(1, validatedQuantity);
        setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    };

    const cartTotal = useMemo(() => 
        cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
        [cart]
    );

    const handleSubmitSale = () => {
        if (!selectedCustomerId || cart.length === 0) {
            setAlertModal({ isOpen: true, message: "Por favor, selecciona un cliente y añade productos al carrito." });
            return;
        }
        const customer = customers.find(c => c.id === selectedCustomerId);
        onAddSale({
            customerId: selectedCustomerId,
            customerName: customer.name,
            items: cart,
            total: cartTotal,
        });
        setIsSaleModalOpen(false);
        setCart([]);
        setSelectedCustomerId('');
    };

    const handleCreateCustomerSubmit = async (e) => {
        e.preventDefault();
        if(!newCustomerData.name) {
            setAlertModal({isOpen: true, title: "Datos incompletos", message: "El nombre del cliente es obligatorio."});
            return;
        }
        const newCustomerId = await onAddCustomer(newCustomerData);
        setSelectedCustomerId(newCustomerId);
        setIsCreatingCustomer(false);
        setNewCustomerData({ name: '', email: '', phone: '' });
    };
    
    const handleNewCustomerFormChange = (e) => {
        const { name, value } = e.target;
        setNewCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const openSaleModal = () => {
        setIsSaleModalOpen(true);
        setIsCreatingCustomer(false);
        setCart([]);
        setSelectedCustomerId('');
    }

    const openPaymentModal = (sale) => {
        setSaleToPay(sale);
        setPaymentAmount("");
        setSelectedPaymentMethodId(paymentMethods[0]?.id || "");
        setIsPaymentModalOpen(true);
    };
    
    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        const amount = parseInt(paymentAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            setAlertModal({isOpen: true, title: "Monto inválido", message: "Por favor, ingresa un monto de pago válido."});
            return;
        }
        if (amount > saleToPay.balance) {
            setAlertModal({isOpen: true, title: "Monto inválido", message: `El pago no puede ser mayor que el saldo pendiente de ${formatCurrency(saleToPay.balance)}.`});
            return;
        }
        if (!selectedPaymentMethodId) {
            setAlertModal({isOpen: true, title: "Método de pago", message: "Por favor, selecciona un método de pago."});
            return;
        }
        const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
        onAddPayment(saleToPay.id, amount, paymentMethod.id, paymentMethod.name);
        setIsPaymentModalOpen(false);
        setSaleToPay(null);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Ventas y Pagos</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="pending-sales-filter"
                            checked={showOnlyPending}
                            onChange={(e) => setShowOnlyPending(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="pending-sales-filter" className="ml-2 block text-sm text-gray-900">
                            Mostrar solo con saldo pendiente
                        </label>
                    </div>
                    <button onClick={openSaleModal} className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Nueva Venta
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Cliente</th>
                                <th className="p-4 font-semibold text-gray-600">Total</th>
                                <th className="p-4 font-semibold text-gray-600">Pagado</th>
                                <th className="p-4 font-semibold text-gray-600">Saldo</th>
                                <th className="p-4 font-semibold text-gray-600">Fecha</th>
                                <th className="p-4 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map(sale => (
                                <tr key={sale.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 text-gray-800">{sale.customerName}</td>
                                    <td className="p-4 text-gray-800">{formatCurrency(sale.total)}</td>
                                    <td className="p-4 text-gray-800">{formatCurrency(sale.total - sale.balance)}</td>
                                    <td className={`p-4 font-medium ${sale.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(sale.balance)}</td>
                                    <td className="p-4 text-gray-600 text-sm">{sale.date ? sale.date.toDate().toLocaleString() : 'N/A'}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => openPaymentModal(sale)} 
                                            disabled={sale.balance === 0}
                                            className="bg-green-500 text-white px-3 py-1 rounded-md text-sm shadow hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            Registrar Pago
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Nueva Venta */}
            <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Crear Nueva Venta">
                <div className="space-y-6">
                    {isCreatingCustomer ? (
                        <form onSubmit={handleCreateCustomerSubmit}>
                            <h4 className="text-md font-medium text-gray-800 mb-2">Nuevo Cliente</h4>
                            <div className="mb-4">
                                <label htmlFor="new-customer-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" name="name" id="new-customer-name" value={newCustomerData.name} onChange={handleNewCustomerFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="new-customer-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" name="email" id="new-customer-email" value={newCustomerData.email} onChange={handleNewCustomerFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="new-customer-phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="tel" name="phone" id="new-customer-phone" value={newCustomerData.phone} onChange={handleNewCustomerFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="flex justify-end space-x-3 mt-4">
                                <button type="button" onClick={() => setIsCreatingCustomer(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Guardar Cliente</button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
                            <div className="flex space-x-2">
                                <select id="customer" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option value="">-- Elige un cliente --</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={() => setIsCreatingCustomer(true)} title="Crear Nuevo Cliente" className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <hr/>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Añadir Productos</label>
                        <div className="flex flex-wrap gap-2">
                            {products
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(p => (
                                <button key={p.id} onClick={() => handleAddProductToCart(p.id)} className="flex-grow text-left p-2 border rounded-md hover:bg-gray-100 hover:border-blue-500 transition-colors min-w-[120px]">
                                    <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                                    <p className="text-sm text-green-600">{formatCurrency(p.price)}</p>
                                    <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {cart.length > 0 && (
                        <div>
                            <h4 className="text-md font-medium text-gray-800 mb-2">Carrito</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))} className="w-16 text-center border rounded-md" />
                                            <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-right font-bold text-lg mt-4">
                                Total: {formatCurrency(cartTotal)}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsSaleModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar Venta</button>
                        <button onClick={handleSubmitSale} className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-purple-300" disabled={!selectedCustomerId || cart.length === 0}>Confirmar Venta</button>
                    </div>
                </div>
            </Modal>
            
            {/* Modal para Registrar Pago por Venta */}
            {saleToPay && (
                <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Registrar Pago para Venta #${saleToPay.id.slice(0,6)}`}>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="mb-4">
                            <p>Cliente: <span className="font-semibold">{saleToPay.customerName}</span></p>
                            <p>Total Venta: <span className="font-semibold">{formatCurrency(saleToPay.total)}</span></p>
                            <p>Saldo Pendiente: <span className="font-semibold text-red-600">{formatCurrency(saleToPay.balance)}</span></p>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar</label>
                            <input 
                                type="number" 
                                id="paymentAmount" 
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                required 
                                step="1" 
                                min="1"
                                max={saleToPay.balance}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                            <select id="paymentMethod" value={selectedPaymentMethodId} onChange={(e) => setSelectedPaymentMethodId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Guardar Pago</button>
                        </div>
                    </form>
                </Modal>
            )}

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: '' })}
                title={alertModal.title || "Aviso"}
                message={alertModal.message}
            />
        </div>
    );
};

// Componente de Pagos
const Payments = ({ payments, sales, onRegisterNewPayment }) => {
    const [expandedGroupId, setExpandedGroupId] = useState(null);

    const groupedPayments = useMemo(() => {
        const groups = {};
        payments.forEach(payment => {
            const sale = sales.find(s => s.id === payment.saleId);
            if (!groups[payment.paymentGroupId]) {
                groups[payment.paymentGroupId] = {
                    id: payment.paymentGroupId,
                    date: payment.date ? payment.date.toDate() : new Date(),
                    customerName: sale ? sale.customerName : 'N/A',
                    paymentMethodName: payment.paymentMethodName,
                    totalAmount: 0,
                    applications: []
                };
            }
            groups[payment.paymentGroupId].totalAmount += payment.amount;
            groups[payment.paymentGroupId].applications.push({
                saleId: payment.saleId,
                amount: payment.amount
            });
        });
        return Object.values(groups).sort((a, b) => b.date - a.date);
    }, [payments, sales]);

    const toggleExpand = (groupId) => {
        setExpandedGroupId(prevId => (prevId === groupId ? null : groupId));
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Historial de Pagos</h2>
                <button onClick={onRegisterNewPayment} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Registrar Pago
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 w-12"></th>
                                <th className="p-4 font-semibold text-gray-600">Fecha</th>
                                <th className="p-4 font-semibold text-gray-600">Cliente</th>
                                <th className="p-4 font-semibold text-gray-600">Monto Total Pagado</th>
                                <th className="p-4 font-semibold text-gray-600">Método de Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedPayments.map(group => (
                                <React.Fragment key={group.id}>
                                    <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(group.id)}>
                                        <td className="p-4 text-center">
                                            {expandedGroupId === group.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </td>
                                        <td className="p-4 text-gray-600">{group.date ? group.date.toLocaleString() : 'N/A'}</td>
                                        <td className="p-4 text-gray-800">{group.customerName}</td>
                                        <td className="p-4 text-green-600 font-medium">{formatCurrency(group.totalAmount)}</td>
                                        <td className="p-4 text-gray-800">{group.paymentMethodName}</td>
                                    </tr>
                                    {expandedGroupId === group.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="5" className="p-0">
                                                <div className="p-4 pl-16">
                                                    <h4 className="font-semibold mb-2">Detalle de Aplicación del Pago:</h4>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {group.applications.map((app, index) => (
                                                            <li key={index} className="text-sm text-gray-700">
                                                                <span className="font-medium">{formatCurrency(app.amount)}</span> aplicados a la venta <span className="font-mono text-xs bg-gray-200 p-1 rounded">#{app.saleId.slice(0, 6)}...</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Componente de Login
const LoginScreen = ({ setAlertModal }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [view, setView] = useState('login'); // 'login' or 'reset'
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Error: Email o contraseña incorrectos.');
            setAlertModal({isOpen: true, title: "Error de Autenticación", message: "El email o la contraseña son incorrectos. Por favor, inténtalo de nuevo."})
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetMessage('¡Revisa tu correo! Se ha enviado un enlace para recuperar tu contraseña.');
        } catch (err) {
            setError('No se pudo enviar el correo. Verifica que la dirección sea correcta.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-center mb-6">
                    <ShoppingCart size={48} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Kiosko</h2>
                
                {view === 'login' ? (
                    <>
                        <p className="text-center text-gray-600 mb-8">Iniciar sesión para continuar</p>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <div>
                                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Ingresar
                                </button>
                            </div>
                            <div className="text-center">
                                <button type="button" onClick={() => setView('reset')} className="text-sm text-blue-600 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="text-center text-gray-600 mb-8">Recuperar Contraseña</p>
                        <form onSubmit={handlePasswordReset} className="space-y-6">
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                                <input type="email" id="reset-email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {resetMessage && <p className="text-green-600 text-sm text-center">{resetMessage}</p>}
                            <div>
                                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Enviar enlace de recuperación
                                </button>
                            </div>
                            <div className="text-center">
                                <button type="button" onClick={() => setView('login')} className="text-sm text-blue-600 hover:underline">
                                    Volver a inicio de sesión
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};


// Componente Principal App
export default function App() {
    const [user, setUser] = useState(null);
    const [storeId, setStoreId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [payments, setPayments] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [customerPayment, setCustomerPayment] = useState({isOpen: false, customerId: null, totalDebt: 0});
    const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Usuario ha iniciado sesión, buscar su tienda asignada
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setStoreId(userDocSnap.data().storeId);
                } else {
                    // Manejar caso donde el usuario no tiene tienda asignada
                    console.error("Usuario autenticado pero sin tienda asignada en Firestore.");
                    setStoreId(null);
                }
                setUser(currentUser);
            } else {
                // Usuario ha cerrado sesión
                setUser(null);
                setStoreId(null);
            }
            setLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);
    
    useEffect(() => {
        if (!storeId) {
            // Si no hay storeId, limpiar los datos para evitar mostrar datos de otra tienda
            setProducts([]);
            setCustomers([]);
            setSales([]);
            setPayments([]);
            setPaymentMethods([]);
            return;
        };

        const productsRef = collection(db, "stores", storeId, "products");
        const customersRef = collection(db, "stores", storeId, "customers");
        const salesRef = collection(db, "stores", storeId, "sales");
        const paymentsRef = collection(db, "stores", storeId, "payments");
        const paymentMethodsRef = collection(db, "stores", storeId, "paymentMethods");

        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
        });

        const unsubscribeCustomers = onSnapshot(customersRef, (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(customersData);
        });
        
        const unsubscribeSales = onSnapshot(salesRef, (snapshot) => {
            const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesData);
        });

        const unsubscribePayments = onSnapshot(paymentsRef, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPayments(paymentsData);
        });

        const unsubscribePaymentMethods = onSnapshot(paymentMethodsRef, (snapshot) => {
            const methodsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPaymentMethods(methodsData);
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCustomers();
            unsubscribeSales();
            unsubscribePayments();
            unsubscribePaymentMethods();
        };
    }, [storeId]);

    // --- CRUD Functions adaptadas para Multi-Sucursal ---
    const handleAddProduct = async (productData) => {
        await addDoc(collection(db, "stores", storeId, "products"), productData);
    };
    const handleUpdateProduct = async (id, updatedProduct) => {
        const productDoc = doc(db, "stores", storeId, "products", id);
        await updateDoc(productDoc, updatedProduct);
    };
    const handleDeleteProduct = async (id) => {
        const productDoc = doc(db, "stores", storeId, "products", id);
        await deleteDoc(productDoc);
    };

    const handleAddCustomer = async (customerData) => {
        const docRef = await addDoc(collection(db, "stores", storeId, "customers"), customerData);
        return docRef.id;
    };
    const handleUpdateCustomer = async (id, updatedCustomer) => {
        const customerDoc = doc(db, "stores", storeId, "customers", id);
        await updateDoc(customerDoc, updatedCustomer);
    };
    const handleDeleteCustomer = async (id) => {
        const customerDoc = doc(db, "stores", storeId, "customers", id);
        await deleteDoc(customerDoc);
    };

    const handleAddSale = async (saleData) => {
        const batch = writeBatch(db);
        const saleRef = doc(collection(db, "stores", storeId, "sales"));
        batch.set(saleRef, {
            ...saleData,
            balance: saleData.total,
            date: new Date(),
        });

        saleData.items.forEach(item => {
            const productRef = doc(db, "stores", storeId, "products", item.id);
            const newStock = item.stock - item.quantity;
            batch.update(productRef, { stock: newStock });
        });

        await batch.commit();
    };

    const handleAddPayment = async (saleId, amount, paymentMethodId, paymentMethodName) => {
        const paymentGroupId = `group_${Date.now()}`;
        
        await addDoc(collection(db, "stores", storeId, "payments"), {
            saleId,
            amount,
            date: new Date(),
            paymentGroupId,
            paymentMethodId,
            paymentMethodName,
        });

        const saleRef = doc(db, "stores", storeId, "sales", saleId);
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            await updateDoc(saleRef, {
                balance: sale.balance - amount
            });
        }
    };

    const handleOpenCustomerPaymentModal = (customerId) => {
        const customerDebt = sales
            .filter(s => s.customerId === customerId && s.balance > 0)
            .reduce((acc, s) => acc + s.balance, 0);
        
        if (customerDebt > 0) {
            setCustomerPayment({ isOpen: true, customerId, totalDebt: customerDebt });
        }
    };
    
    const handleAddPaymentByCustomer = async (customerId, amount, paymentMethodId, paymentMethodName) => {
        let remainingPayment = amount;
        const paymentGroupId = `group_${Date.now()}`;
        const outstandingSales = sales
            .filter(s => s.customerId === customerId && s.balance > 0)
            .sort((a, b) => (a.date?.toDate()?.getTime() || 0) - (b.date?.toDate()?.getTime() || 0));

        const batch = writeBatch(db);

        for (const sale of outstandingSales) {
            if (remainingPayment <= 0) break;

            const paymentForThisSale = Math.min(remainingPayment, sale.balance);
            const saleRef = doc(db, "stores", storeId, "sales", sale.id);
            batch.update(saleRef, { balance: sale.balance - paymentForThisSale });

            const paymentRef = doc(collection(db, "stores", storeId, "payments"));
            batch.set(paymentRef, {
                saleId: sale.id,
                amount: paymentForThisSale,
                date: new Date(),
                paymentGroupId,
                paymentMethodId,
                paymentMethodName,
            });

            remainingPayment -= paymentForThisSale;
        }

        await batch.commit();
        setCustomerPayment({ isOpen: false, customerId: null, totalDebt: 0 });
        setIsNewPaymentModalOpen(false);
    };

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const handleAddPaymentMethod = async (methodData) => {
        await addDoc(collection(db, "stores", storeId, "paymentMethods"), methodData);
    };
    const handleUpdatePaymentMethod = async (id, updatedMethod) => {
        const methodDoc = doc(db, "stores", storeId, "paymentMethods", id);
        await updateDoc(methodDoc, updatedMethod);
    };
    const handleDeletePaymentMethod = async (id) => {
        const methodDoc = doc(db, "stores", storeId, "paymentMethods", id);
        await deleteDoc(methodDoc);
    };


    const NavButton = ({ currentView, viewName, setView, icon: Icon, children }) => (
        <button
            onClick={() => setView(viewName)}
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-all duration-200 w-full text-left ${
                currentView === viewName
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
        >
            <Icon size={22} />
            <span>{children}</span>
        </button>
    );

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard sales={sales} customers={customers} products={products} />;
            case 'products':
                return <Products products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
            case 'customers':
                return <Customers customers={customers} sales={sales} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} onRegisterPayment={handleOpenCustomerPaymentModal} />;
            case 'sales':
                return <Sales sales={sales} customers={customers} products={products} onAddSale={handleAddSale} onAddCustomer={handleAddCustomer} onAddPayment={handleAddPayment} paymentMethods={paymentMethods} />;
            case 'payments':
                return <Payments payments={payments} sales={sales} onRegisterNewPayment={() => setIsNewPaymentModalOpen(true)} />;
            case 'paymentMethods':
                return <PaymentMethods paymentMethods={paymentMethods} onAdd={handleAddPaymentMethod} onUpdate={handleUpdatePaymentMethod} onDelete={handleDeletePaymentMethod} />;
            default:
                return <Dashboard sales={sales} customers={customers} products={products} />;
        }
    };
    
    const CustomerPaymentModal = () => {
        const [amount, setAmount] = useState('');
        const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentMethods[0]?.id || "");
        const customer = customers.find(c => c.id === customerPayment.customerId);

        useEffect(() => {
            if (customerPayment.isOpen) {
                setAmount('');
                setSelectedPaymentMethodId(paymentMethods[0]?.id || "");
            }
        }, [customerPayment.isOpen]);

        const handleSubmit = (e) => {
            e.preventDefault();
            const paymentAmount = parseInt(amount, 10);
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                setAlertModal({isOpen: true, title: "Monto inválido", message: "Por favor, ingresa un monto de pago válido."});
                return;
            }
            if (paymentAmount > customerPayment.totalDebt) {
                setAlertModal({isOpen: true, title: "Monto inválido", message: `El pago no puede ser mayor que la deuda total de ${formatCurrency(customerPayment.totalDebt)}.`});
                return;
            }
            if (!selectedPaymentMethodId) {
                setAlertModal({isOpen: true, title: "Método de pago", message: "Por favor, selecciona un método de pago."});
                return;
            }
            const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
            handleAddPaymentByCustomer(customerPayment.customerId, paymentAmount, paymentMethod.id, paymentMethod.name);
        };

        if (!customerPayment.isOpen || !customer) return null;

        return (
            <Modal isOpen={customerPayment.isOpen} onClose={() => setCustomerPayment({isOpen: false, customerId: null, totalDebt: 0})} title={`Registrar Pago para ${customer.name}`}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <p>Deuda Total del Cliente: <span className="font-semibold text-red-600">{formatCurrency(customerPayment.totalDebt)}</span></p>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="customerPaymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar</label>
                        <input 
                            type="number" 
                            id="customerPaymentAmount" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            required 
                            step="1" 
                            min="1"
                            max={customerPayment.totalDebt}
                            autoFocus
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="customerPaymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select id="customerPaymentMethod" value={selectedPaymentMethodId} onChange={(e) => setSelectedPaymentMethodId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setCustomerPayment({isOpen: false, customerId: null, totalDebt: 0})} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Guardar Pago</button>
                    </div>
                </form>
            </Modal>
        );
    };

    const NewPaymentModal = () => {
        const [selectedCustomer, setSelectedCustomer] = useState('');
        const [amount, setAmount] = useState('');
        const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentMethods[0]?.id || "");

        const customersWithDebt = useMemo(() => {
            const debtorIds = new Set(sales.filter(s => s.balance > 0).map(s => s.customerId));
            return customers.filter(c => debtorIds.has(c.id));
        }, [sales, customers]);

        const selectedCustomerDebt = useMemo(() => {
            if (!selectedCustomer) return 0;
            return sales
                .filter(s => s.customerId === selectedCustomer && s.balance > 0)
                .reduce((acc, s) => acc + s.balance, 0);
        }, [sales, selectedCustomer]);
        
        useEffect(() => {
            if (isNewPaymentModalOpen) {
                setSelectedCustomer('');
                setAmount('');
                setSelectedPaymentMethodId(paymentMethods[0]?.id || "");
            }
        }, [isNewPaymentModalOpen]);

        const handleSubmit = (e) => {
            e.preventDefault();
            const paymentAmount = parseInt(amount, 10);
            if (!selectedCustomer) {
                setAlertModal({isOpen: true, title: "Cliente no seleccionado", message: "Por favor, selecciona un cliente."});
                return;
            }
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                setAlertModal({isOpen: true, title: "Monto inválido", message: "Por favor, ingresa un monto de pago válido."});
                return;
            }
            if (paymentAmount > selectedCustomerDebt) {
                setAlertModal({isOpen: true, title: "Monto inválido", message: `El pago no puede ser mayor que la deuda total de ${formatCurrency(selectedCustomerDebt)}.`});
                return;
            }
            if (!selectedPaymentMethodId) {
                setAlertModal({isOpen: true, title: "Método de pago", message: "Por favor, selecciona un método de pago."});
                return;
            }
            const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
            handleAddPaymentByCustomer(selectedCustomer, paymentAmount, paymentMethod.id, paymentMethod.name);
        };

        if (!isNewPaymentModalOpen) return null;

        return (
            <Modal isOpen={isNewPaymentModalOpen} onClose={() => setIsNewPaymentModalOpen(false)} title="Registrar Nuevo Pago">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700 mb-1">Cliente con Deuda</label>
                        <select 
                            id="customer-select"
                            value={selectedCustomer} 
                            onChange={e => setSelectedCustomer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">-- Seleccione un cliente --</option>
                            {customersWithDebt.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {selectedCustomer && (
                        <>
                            <p>Deuda Total: <span className="font-semibold text-red-600">{formatCurrency(selectedCustomerDebt)}</span></p>
                            <div>
                                <label htmlFor="newPaymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar</label>
                                <input 
                                    type="number" 
                                    id="newPaymentAmount" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    required 
                                    step="1" 
                                    min="1"
                                    max={selectedCustomerDebt}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label htmlFor="newPaymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                <select id="newPaymentMethod" value={selectedPaymentMethodId} onChange={(e) => setSelectedPaymentMethodId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => setIsNewPaymentModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={!selectedCustomer || !amount} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300">Guardar Pago</button>
                    </div>
                </form>
            </Modal>
        );
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    if (!user || !storeId) {
        return <LoginScreen setAlertModal={setAlertModal} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <div className="flex flex-col md:flex-row">
                <aside className="w-full md:w-64 bg-white shadow-lg md:min-h-screen p-4 flex flex-col">
                    <div>
                        <div className="flex items-center mb-8">
                            <ShoppingCart size={32} className="text-blue-500" />
                            <h1 className="text-xl font-bold ml-3 text-gray-800">Kiosko</h1>
                        </div>
                        <nav className="space-y-2">
                            <NavButton currentView={view} viewName="dashboard" setView={setView} icon={DollarSign}>Panel</NavButton>
                            <NavButton currentView={view} viewName="products" setView={setView} icon={Package}>Productos</NavButton>
                            <NavButton currentView={view} viewName="customers" setView={setView} icon={Users}>Clientes</NavButton>
                            <NavButton currentView={view} viewName="sales" setView={setView} icon={ShoppingCart}>Ventas</NavButton>
                            <NavButton currentView={view} viewName="payments" setView={setView} icon={Receipt}>Pagos</NavButton>
                            <NavButton currentView={view} viewName="paymentMethods" setView={setView} icon={CreditCard}>Métodos de Pago</NavButton>
                        </nav>
                    </div>
                    <div className="mt-auto">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-3 px-4 py-2 rounded-md transition-all duration-200 w-full text-left text-red-500 hover:bg-red-100"
                        >
                            <LogOut size={22} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>
                <main className="flex-1 p-6 md:p-10">
                    {renderView()}
                </main>
            </div>
            <CustomerPaymentModal />
            <NewPaymentModal />
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, title:'', message: '' })}
                title={alertModal.title}
                message={alertModal.message}
            />
        </div>
    );
}
