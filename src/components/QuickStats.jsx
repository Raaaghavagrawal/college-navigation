import React from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiNavigation, FiClock, FiTrendingUp } from 'react-icons/fi';

export function QuickStats({ totalLocations = 0, routesFound = 0 }) {
    const stats = [
        {
            icon: FiMapPin,
            label: 'Locations',
            value: totalLocations,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            icon: FiNavigation,
            label: 'Routes',
            value: routesFound,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            icon: FiClock,
            label: 'Avg Time',
            value: '2-5 min',
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10',
        },
        {
            icon: FiTrendingUp,
            label: 'Active',
            value: 'Live',
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-500/10',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 p-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${stat.bgColor} backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer group`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`bg-gradient-to-br ${stat.color} p-1.5 rounded-lg`}>
                            <stat.icon className="text-white text-xs" />
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                            {stat.label}
                        </span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                        {stat.value}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export default QuickStats;
