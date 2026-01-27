"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiHomeLine, RiCarLine, RiSearchLine, RiArrowLeftLine } from 'react-icons/ri';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-8 md:p-12 text-center">
            {/* Error Code */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <Badge 
                variant="secondary" 
                className="text-6xl md:text-8xl font-bold px-6 py-3 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-none"
              >
                404
              </Badge>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <RiCarLine className="w-16 h-16 text-primary" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              Halaman Tidak Ditemukan
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-8"
            >
              <p className="text-muted-foreground text-lg mb-4">
                Maaf, halaman yang Anda cari tidak dapat ditemukan di sistem parkir kami.
              </p>
              <p className="text-muted-foreground">
                Sepertinya halaman ini telah dipindahkan atau tidak pernah ada.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                asChild 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link href="/" className="inline-flex items-center gap-2">
                  <RiHomeLine className="w-5 h-5" />
                  Kembali ke Beranda
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline"
                className="w-full sm:w-auto border-border/60 hover:bg-muted/50 transition-all duration-200"
              >
                <Link href="/dashboard" className="inline-flex items-center gap-2">
                  <RiSearchLine className="w-5 h-5" />
                  Ke Dashboard
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-8 pt-6 border-t border-border/40"
            >
              <Button 
                variant="ghost" 
                asChild
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Link href="javascript:history.back()" className="inline-flex items-center gap-2">
                  <RiArrowLeftLine className="w-4 h-4" />
                  Kembali ke halaman sebelumnya
                </Link>
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </motion.div>
      </motion.div>
    </div>
  );
}
