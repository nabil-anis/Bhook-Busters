
import React, { useState, useEffect, useCallback, useRef, FC } from 'react';
// FIX: Import `Variants` type from framer-motion to fix type inference issues.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import type { MenuItem } from './types';

// CONSTANTS
const LS_KEYS = {
    MENU: 'bb_menu_v7',
    THEME: 'bb_theme_v7',
    ADMIN_PASS: 'bb_admin_pass_v8',
};

const DEMO_MENU: MenuItem[] = [
  { id: 'm' + Math.random().toString(36).slice(2,9), name: 'Spaghetti Aglio e Olio', price: 140, desc: 'Light, garlicky, with cherry tomatoes and a hint of chili.', img: 'https://images.unsplash.com/photo-1621996346565-e30646e20fb0?q=80&w=600&auto=format&fit=crop' },
  { id: 'm' + Math.random().toString(36).slice(2,9), name: 'Chicken Rolls (2 pcs)', price: 160, desc: 'Crispy, tangy, and perfectly packed for a study break.', img: 'https://images.unsplash.com/photo-1625034692255-c2d184de7a39?q=80&w=600&auto=format&fit=crop' },
  { id: 'm' + Math.random().toString(36).slice(2,9), name: 'Shami Kabab (4 pcs)', price: 180, desc: 'Classic homemade kababs, rich in flavor and spices.', img: 'https://images.unsplash.com/photo-1604503462815-5c45e5a59e9a?q=80&w=600&auto=format&fit=crop' },
];

const WHATSAPP_LINK = 'https://wa.me/923282681551';

// HELPER FUNCTIONS
const genId = () => 'm' + Math.random().toString(36).slice(2, 9);
const generatePassword = (len = 8) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
};
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// --- CUSTOM HOOKS ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

const useToast = () => {
    const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const showToast = useCallback((message: string, duration = 3000) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setToast({ message, id: Date.now() });
        timeoutRef.current = window.setTimeout(() => {
            setToast(null);
        }, duration);
    }, []);

    return { toast, showToast };
};

// --- ANIMATION VARIANTS ---
// FIX: Explicitly type animation variants with `Variants` to avoid TypeScript errors.
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

// FIX: Explicitly type animation variants with `Variants` to avoid TypeScript errors.
const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

// --- UI COMPONENTS ---

const Toast: FC<{ toast: { message: string } | null }> = ({ toast }) => {
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                    className="fixed right-5 bottom-5 bg-zinc-900 text-white py-3 px-5 rounded-lg shadow-2xl z-[10010]"
                    role="status" aria-live="polite"
                >
                    {toast.message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const AdminModal: FC<any> = ({ isOpen, isUnlocked, onClose, onUnlock, onAddDish, onChangePassword, showToast }) => {
    const [password, setPassword] = useState('');
    const [dishName, setDishName] = useState('');
    const [dishPrice, setDishPrice] = useState('');
    const [dishDesc, setDishDesc] = useState('');
    const [dishImg, setDishImg] = useState<File | null>(null);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    
    const handleUnlock = () => onUnlock(password);
    
    const handleAddDish = () => {
        if (!dishName || !dishPrice) {
            showToast('Dish name and price are required.');
            return;
        }
        onAddDish(dishName, Number(dishPrice), dishDesc, dishImg);
        setDishName(''); setDishPrice(''); setDishDesc(''); setDishImg(null);
    };

    const handleChangePassword = () => {
        if (onChangePassword(currentPass, newPass)) {
            setCurrentPass(''); setNewPass('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ ease: "easeInOut", duration: 0.2 }}
                        className="w-full max-w-2xl p-6 rounded-2xl shadow-2xl glass-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-orange-400">Chef’s Key — Admin</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">Unlock to edit today's menu.</p>

                        {!isUnlocked ? (
                            <div className="space-y-4">
                                <input
                                    type="password" placeholder="Enter password"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                    className="form-input"
                                />
                                <div className="flex justify-end gap-3"><button onClick={onClose} className="btn btn-ghost">Close</button><button onClick={handleUnlock} className="btn btn-primary">Unlock</button></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-orange-400 mb-2">Add New Dish</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input value={dishName} onChange={e => setDishName(e.target.value)} type="text" placeholder="Dish name" className="form-input" />
                                        <input value={dishPrice} onChange={e => setDishPrice(e.target.value)} type="number" placeholder="Price (Rs.)" className="form-input" />
                                        <input value={dishDesc} onChange={e => setDishDesc(e.target.value)} type="text" placeholder="Short description" className="form-input md:col-span-2" />
                                        <input onChange={e => setDishImg(e.target.files ? e.target.files[0] : null)} type="file" accept="image/*" className="form-input md:col-span-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200" />
                                    </div>
                                    <div className="flex justify-end mt-4"><button onClick={handleAddDish} className="btn btn-primary">Add Dish</button></div>
                                </div>
                                <div className="border-t border-white/10 pt-6">
                                    <h4 className="font-semibold text-orange-400 mb-2">Change Password</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input value={currentPass} onChange={e => setCurrentPass(e.target.value)} type="password" placeholder="Current password" className="form-input" />
                                        <input value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="New password" className="form-input" />
                                    </div>
                                    <div className="flex justify-end mt-4"><button onClick={handleChangePassword} className="btn btn-ghost">Change</button></div>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-white/10 pt-6"><button onClick={onClose} className="btn btn-ghost">Close</button></div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const MenuItemRow: FC<any> = ({ item, isUnlocked, onUpdate, onDelete }) => {
    return (
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl mb-3 glass-panel hover:border-white/20 dark:hover:border-white/20 hover:border-black/20 transition-all duration-300">
            <img src={item.img || `https://picsum.photos/seed/${item.id}/400/300`} alt={item.name} className="w-full sm:w-28 h-40 sm:h-24 object-cover rounded-lg flex-shrink-0"/>
            <div className="flex-1">
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{item.desc}</p>
            </div>
            <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-orange-500 font-bold text-lg min-w-[90px] text-right">Rs. {item.price}</div>
                {isUnlocked && <button onClick={() => onDelete(item.id)} className="btn !p-2 text-red-400 hover:bg-red-500/10" aria-label={`Delete ${item.name}`}><i className="fas fa-trash"></i></button>}
            </div>
        </motion.div>
    );
};

const MotionSection: FC<any> = ({ children, className, ...props }) => (
    <motion.section
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        {...props}
    >
        {children}
    </motion.section>
);


// --- APP ---
const App: FC = () => {
    const [menu, setMenu] = useLocalStorage<MenuItem[]>(LS_KEYS.MENU, []);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>(LS_KEYS.THEME, 'dark');
    const [adminPassword, setAdminPassword] = useLocalStorage<string>(LS_KEYS.ADMIN_PASS, '');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast, showToast } = useToast();

    useEffect(() => {
        if (!adminPassword) {
            const newPass = 'i~sha';
            setAdminPassword(newPass);
            showToast(`Admin pass: ${newPass}`, 7000);
        }
        if (menu.length === 0) {
            setMenu(DEMO_MENU);
            showToast("Demo loaded. Use 'Chef's Key' to edit.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);
    
    const handleUnlock = (password: string) => {
        if (password === adminPassword) { setIsUnlocked(true); showToast('Kitchen unlocked!'); return true; }
        showToast('Incorrect password.'); return false;
    };

    const handleAddDish = async (name: string, price: number, desc: string, imgFile: File | null) => {
        let img = '';
        if (imgFile) {
            try {
                img = await fileToBase64(imgFile);
            } catch (error) {
                console.error("Error converting file to Base64:", error);
                showToast("Could not process image file.");
                return;
            }
        }
        setMenu(prev => [{ id: genId(), name, price, desc, img }, ...prev]);
        showToast('Dish added!');
    };
    
    const handleDeleteDish = (id: string) => {
        if (window.confirm('Remove this dish?')) {
            setMenu(prev => prev.filter(item => item.id !== id));
            showToast('Dish removed.');
        }
    };
    
    const handleChangePassword = (current: string, newPass: string) => {
        if (current !== adminPassword) { showToast('Current password incorrect.'); return false; }
        if (newPass.length < 6) { showToast('New password too short.'); return false; }
        setAdminPassword(newPass); showToast('Password changed!'); return true;
    };

    const openLink = (url: string) => window.open(url, '_blank');
    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="max-w-[var(--max-w)] mx-auto p-4 md:p-6">
            <Toast toast={toast} />
            <AdminModal isOpen={isModalOpen} isUnlocked={isUnlocked} onClose={() => setIsModalOpen(false)} onUnlock={handleUnlock} onAddDish={handleAddDish} onChangePassword={handleChangePassword} showToast={showToast} />

            <motion.header 
                initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 100 }}
                className="glass-panel rounded-xl p-3 px-5 shadow-lg flex items-center justify-between gap-3 sticky top-4 z-40"
            >
                <div className="font-extrabold text-orange-500 tracking-wider text-lg">BHOOK BUSTERS</div>
                <nav className="hidden md:block">
                    <ul className="flex gap-6 items-center list-none">
                        {['Menu', 'Why Us', 'Contact'].map(item => (
                            <li key={item}><a href={`#${item.toLowerCase().replace(' ','')}`} onClick={(e) => { e.preventDefault(); scrollTo(item.toLowerCase().replace(' ',''))}} className="font-semibold text-sm hover:text-orange-500 transition-colors">{item}</a></li>
                        ))}
                    </ul>
                </nav>
                <div className="flex gap-2 items-center">
                    <button onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')} className="btn btn-ghost !p-2.5" aria-label="Toggle Theme"><i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i></button>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-ghost text-sm hidden sm:inline">🔐 Chef's Key</button>
                    <button onClick={() => openLink(WHATSAPP_LINK)} className="btn btn-primary text-sm">Order Now</button>
                </div>
            </motion.header>

            <main>
                <MotionSection className="hero min-h-[60vh] md:min-h-[70vh] flex items-center justify-center text-center mt-5 p-6 rounded-2xl shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1740&auto=format&fit=crop" alt="Food background" className="absolute inset-0 w-full h-full object-cover"/>
                    <div className="relative z-20 text-white max-w-3xl">
                        <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-extrabold mb-3 leading-tight text-shadow">Craving something that actually tastes like Food?</motion.h1>
                        <motion.p variants={itemVariants} className="text-base md:text-lg mb-6 text-zinc-200">Bhook Busters — the student-run lunchbox service born out of cafeteria trauma. When campus food lets you down (again), we step in with real, home-style flavor and zero drama.</motion.p>
                        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center">
                            <button onClick={() => scrollTo('menu')} className="btn btn-primary">See Today’s Menu</button>
                            <button onClick={() => openLink(WHATSAPP_LINK)} className="btn btn-ghost !border-white/50 !text-white">Order on WhatsApp</button>
                        </motion.div>
                    </div>
                </MotionSection>

                <MotionSection id="menu" className="mt-8 flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 w-full">
                        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-3xl font-bold text-orange-500">Today's Menu</h2>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Small, honest selection. Updated nightly.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(true)} className="btn btn-ghost !p-2.5 text-sm" aria-label="Open Admin Panel"><i className="fas fa-key"></i></button>
                        </motion.div>
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" aria-live="polite">
                            {menu.length > 0 ? menu.map(item => <MenuItemRow key={item.id} item={item} isUnlocked={isUnlocked} onDelete={handleDeleteDish} />) : <p className="text-zinc-500 p-4 glass-panel rounded-xl">No dishes listed today.</p>}
                        </motion.div>
                    </div>
                    <motion.aside variants={itemVariants} className="w-full lg:w-80 flex-shrink-0 rounded-2xl p-5 glass-panel sticky top-24">
                        <strong className="text-orange-500 font-bold block mb-2">Open • Today</strong>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">Mon–Fri: 10:00 — 19:00<br/>Sat: 11:00 — 17:00 • Sun: Closed</div>
                        <strong className="text-orange-500 font-bold block mt-4 mb-2">Pickup & Delivery</strong>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Small batches — message early to avoid disappointment.</p>
                        <div className="mt-4"><button onClick={() => openLink(WHATSAPP_LINK)} className="btn btn-primary w-full">Order on WhatsApp</button></div>
                    </motion.aside>
                </MotionSection>

                <MotionSection id="whyus" className="py-20">
                    <motion.h3 variants={itemVariants} className="text-3xl font-bold text-center mb-10">Why Choose Us?</motion.h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                        {[
                          { icon: 'fa-home', title: 'Homemade & Honest', desc: "Tastes like a hug, minus the awkward family questions." },
                          { icon: 'fa-dollar-sign', title: 'Student-Priced', desc: "Cheaper than your textbook, and way more satisfying." },
                          { icon: 'fa-leaf', title: 'Fresh, Small Batches', desc: "Fresher than that excuse you gave your professor. We cook daily." },
                          { icon: 'fa-comments', title: 'WhatsApp Ordering', desc: "Slide into our DMs (on WhatsApp) for your lunch hookup." },
                        ].map(b => (
                            <motion.div variants={itemVariants} key={b.title} className="benefit p-6 rounded-2xl glass-panel">
                                <i className={`fas ${b.icon} text-3xl text-orange-500 mb-4`}></i>
                                <h4 className="text-lg font-bold mb-2">{b.title}</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{b.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </MotionSection>
                
                <MotionSection id="contact" className="py-16">
  <motion.h3
    variants={itemVariants}
    className="text-center text-3xl font-bold mb-10"
  >
    Get in touch
  </motion.h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
    <motion.div
      variants={itemVariants}
      className="text-zinc-500 dark:text-zinc-400"
    >
      <p className="mb-4">
        Quick contacts:<br />
        WhatsApp:{" "}
        <strong className="text-orange-500">+92 328 2681551</strong>
        <br />
        Email:{" "}
        <strong className="text-orange-500">aamirhumnah@gmail.com</strong>
      </p>
      <p>
        Want to join the chef’s circle? DM on Instagram or message the WhatsApp
        group.
      </p>
    </motion.div>

    <motion.div variants={itemVariants} className="p-6 rounded-2xl glass-panel">
      <form
        action="https://formsubmit.co/aamirhumnah@gmail.com"
        method="POST"
      >
        {/* Honeypot field for spam protection */}
        <input type="hidden" name="_honey" style={{ display: "none" }} />

        {/* Disable Captcha */}
        <input type="hidden" name="_captcha" value="false" />

        {/* Redirect after submit (optional) */}
        <input
          type="hidden"
          name="_next"
          value="https://yourwebsite.com/thankyou"
        />

        <input
          id="name"
          className="form-input"
          type="text"
          name="name"
          placeholder="Your Name"
          required
        />
        <input
          id="email"
          className="form-input"
          type="email"
          name="email"
          placeholder="Your Email"
          required
        />
        <textarea
          id="message"
          className="form-input"
          name="message"
          rows={4}
          placeholder="Your Message"
          required
        ></textarea>
        <button type="submit" className="btn btn-primary w-full mt-3">
          Send
        </button>
      </form>
    </motion.div>
  </div>
</MotionSection>

            </main>

            <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 glass-panel rounded-xl p-8 text-center md:text-left">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h4 className="font-semibold mb-3 text-orange-400">Bhook Busters</h4>
                        <p className="text-sm text-zinc-500">Homemade lunchboxes for hungry students. © 2025</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3 text-orange-400">Links</h4>
                        <ul className="space-y-2 text-sm text-zinc-500">
                             {['Menu', 'Why Us', 'Contact'].map(item => (
                                <li key={item}><a href={`#${item.toLowerCase().replace(' ','')}`} onClick={(e) => { e.preventDefault(); scrollTo(item.toLowerCase().replace(' ',''))}} className="hover:text-orange-400 transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3 text-orange-400">Follow</h4>
                        <div className="flex gap-4 justify-center md:justify-start text-xl">
                            <a href="#" aria-label="Instagram" className="text-zinc-500 hover:text-orange-400 transition-colors"><i className="fab fa-instagram"></i></a>
                            <a href="#" aria-label="Facebook" className="text-zinc-500 hover:text-orange-400 transition-colors"><i className="fab fa-facebook"></i></a>
                            <a href="#" aria-label="WhatsApp" className="text-zinc-500 hover:text-orange-400 transition-colors"><i className="fab fa-whatsapp"></i></a>
                        </div>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
};

export default App;