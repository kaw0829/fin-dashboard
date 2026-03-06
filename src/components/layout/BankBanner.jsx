import { Landmark } from 'lucide-react'

export default function BankBanner({ collapsed }) {
  return (
    <div className={`border-b border-gold-400 bg-navy-900 shrink-0 ${collapsed ? 'flex items-center justify-center py-4' : 'flex items-center gap-3 px-6 py-4'}`}>
      <Landmark className="text-gold-400 shrink-0" size={28} />
      {!collapsed && (
        <div>
          <div className="text-gold-400 font-bold text-sm leading-tight tracking-wide">
            Weavers Guild Of Whiterun
          </div>
          <div className="text-gold-300 text-xs italic mt-0.5">
            What is Woven Holds.
          </div>
          <div className="text-gold-200 text-xs tracking-widest uppercase mt-1">
            Staff Portal
          </div>
        </div>
      )}
    </div>
  )
}
