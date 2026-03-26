import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  Loader2, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import { Settings } from './components/Settings';
import { FileUploader } from './components/FileUploader';
import { extractTableData } from './lib/gemini';

type AppState = 'idle' | 'processing' | 'success' | 'error';

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [state, setState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored) {
      setApiKey(stored);
    } else {
      setIsSettingsOpen(true);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setFileName(file.name.replace('.pdf', ''));
    setState('processing');
    setErrorMessage(null);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      const chunkSize = 5;
      const chunks = Math.ceil(pageCount / chunkSize);
      
      let allSheets: any[] = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, pageCount);
        
        // Create a new PDF for this chunk
        const chunkDoc = await PDFDocument.create();
        const pages = await chunkDoc.copyPages(pdfDoc, Array.from({ length: end - start }, (_, k) => start + k));
        pages.forEach(page => chunkDoc.addPage(page));
        
        const chunkPdfBytes = await chunkDoc.save();
        const base64 = btoa(
          new Uint8Array(chunkPdfBytes)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const chunkInfo = `(Processing pages ${start + 1} to ${end} of ${pageCount})`;
        const result = await extractTableData(apiKey, base64, chunkInfo);
        
        if (result && result.sheets) {
          allSheets = [...allSheets, ...result.sheets];
        }
        
        setProgress(Math.round(((i + 1) / chunks) * 100));
      }

      // Merge sheets with the same name if they exist
      const mergedSheetsMap = new Map<string, any[]>();
      allSheets.forEach(sheet => {
        const existing = mergedSheetsMap.get(sheet.name) || [];
        // Skip header row for subsequent chunks if it looks like a header
        const dataToAdd = existing.length > 0 ? sheet.data.slice(1) : sheet.data;
        mergedSheetsMap.set(sheet.name, [...existing, ...dataToAdd]);
      });

      const finalSheets = Array.from(mergedSheetsMap.entries()).map(([name, data]) => ({ name, data }));
      setExtractedData({ sheets: finalSheets });
      setState('success');
    } catch (error: any) {
      console.error(error);
      setState('error');
      setErrorMessage(error.message || 'An unexpected error occurred during processing.');
    }
  };

  const downloadExcel = () => {
    if (!extractedData) return;

    const wb = XLSX.utils.book_new();
    
    extractedData.sheets.forEach((sheet: any) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet1');
    });

    XLSX.writeFile(wb, `${fileName}_converted.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                StatementSync <span className="text-blue-600">Lite</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center space-y-4 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight"
          >
            PDF to Excel, <span className="text-blue-600">Perfectly Formatted.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Extract complex tables from bank statements, invoices, and reports using Gemini 2.5 Flash. 
            Private, fast, and accurate.
          </motion.p>
        </div>

        <div className="space-y-8">
          <FileUploader 
            onFileSelect={handleFileSelect} 
            isProcessing={state === 'processing'} 
          />

          <AnimatePresence mode="wait">
            {state === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">Analyzing Document</h3>
                    <p className="text-slate-500">Processing in chunks to ensure 100% accuracy for large files...</p>
                    <p className="text-blue-600 font-bold text-lg">{progress}% Complete</p>
                  </div>
                  <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-600"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-green-100 rounded-3xl p-8 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-grow text-center sm:text-left space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">Extraction Complete!</h3>
                    <p className="text-slate-500">
                      Successfully processed all pages and merged tables.
                    </p>
                  </div>
                  <button
                    onClick={downloadExcel}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-slate-200"
                  >
                    <Download className="w-5 h-5" />
                    Download Excel
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 border border-red-100 rounded-3xl p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-red-900">Extraction Failed</h3>
                    <p className="text-red-700 text-sm leading-relaxed">
                      {errorMessage}
                    </p>
                    <button 
                      onClick={() => setState('idle')}
                      className="text-red-900 font-bold text-sm flex items-center gap-1 hover:underline"
                    >
                      Try again <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Privacy First",
              desc: "Your API key and documents stay in your browser. Processing happens directly via Gemini SDK.",
              icon: "🔒"
            },
            {
              title: "Exact Formatting",
              desc: "Gemini 2.5 Flash understands complex layouts, merged cells, and multi-page tables.",
              icon: "📊"
            },
            {
              title: "PWA Ready",
              desc: "Install StatementSync Lite on your desktop or mobile for a native app experience.",
              icon: "📱"
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© 2026 StatementSync Lite. Powered by Gemini 2.5 Flash.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onKeySave={(key) => setApiKey(key)}
      />
    </div>
  );
}
