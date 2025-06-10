"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Youtube } from "lucide-react"
import Logo from "./Logo"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    servicios: [
      { name: "Consultoría en IA", href: "#servicios" },
      { name: "Automatización", href: "#servicios" },
      { name: "Desarrollo Web", href: "#servicios" },
      { name: "Análisis de Datos", href: "#servicios" },
    ],
    empresa: [
      { name: "Sobre Nosotros", href: "#nosotros" },
      { name: "Casos de Éxito", href: "#casos" },
      { name: "Blog", href: "#blog" },
      { name: "Contacto", href: "#contacto" },
    ],
    recursos: [
      { name: "Guías Gratuitas", href: "#blog" },
      { name: "Webinars", href: "#blog" },
      { name: "Casos de Estudio", href: "#casos" },
      { name: "Newsletter", href: "#blog" },
    ],
  }

  const socialLinks = [
    { icon: Linkedin, href: "https://linkedin.com/company/altairalabs", label: "LinkedIn" },
    { icon: Twitter, href: "https://twitter.com/altairalabs", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com/altairalabs", label: "Instagram" },
    { icon: Youtube, href: "https://youtube.com/@altairalabs", label: "YouTube" },
  ]

  return (
    <footer className="bg-gradient-to-b from-slate-200 to-slate-300 border-t border-slate-300">
      <div className="container mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="text-slate-600 mt-4 leading-relaxed font-light">
              Transformamos pequeñas empresas con IA y automatización. Tecnología avanzada, precios accesibles.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3 text-slate-600">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm">contacto@altairalabs.com</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm">+34 900 123 456</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm">España | Bélgica | Marruecos</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-slate-800 font-bold mb-4">Servicios</h3>
            <ul className="space-y-2">
              {footerLinks.servicios.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-slate-800 font-bold mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-slate-800 font-bold mb-4">Recursos</h3>
            <ul className="space-y-2">
              {footerLinks.recursos.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-slate-800 font-bold mb-4">Newsletter</h3>
            <p className="text-slate-600 text-sm mb-4 font-light">Recibe las últimas tendencias en IA</p>
            <div className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg font-medium transition-all duration-300 text-white text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/20">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-300">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            {socialLinks.map((social) => {
              const IconComponent = social.icon
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 border border-slate-300 shadow-sm"
                  aria-label={social.label}
                >
                  <IconComponent className="w-5 h-5 text-slate-600 hover:text-white" />
                </a>
              )
            })}
          </div>

          <div className="text-slate-600 text-sm text-center md:text-right font-light">
            <p>&copy; {currentYear} Altaira Labs. Todos los derechos reservados.</p>
            <p className="mt-1">Transformación digital para PYMES</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
