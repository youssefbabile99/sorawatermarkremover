/**
 * inject-image-seo.js
 * Injects IPTC/XMP/EXIF metadata into blog images + logo using exiftool.
 * This ensures metadata is visible in macOS Get Info (Comments, Keywords).
 * 
 * Run: node inject-image-seo.js
 */
const { exiftool } = require('exiftool-vendored');
const fs = require('fs');
const path = require('path');

const BLOG_IMAGES_DIR = path.join(__dirname, 'public', 'blog', 'images');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Image SEO metadata definitions
const IMAGE_SEO = [
    {
        file: 'sorawatermarkremover-sora-watermark-remover-og.jpg',
        title: 'SoraWatermarkRemover - Free AI Video Watermark Removal Tool 2026',
        description: 'SoraWatermarkRemover is a free online tool to remove Sora AI watermarks from videos instantly. Remove watermark, download HD video, batch processing, ZIP download. Best free sora watermark remover tool available online.',
        keywords: ['sora watermark remover', 'remove sora watermark', 'sorawatermarkremover', 'free sora tool', 'ai video watermark removal', 'sora watermark remover 2026', 'openai sora watermark', 'remove watermark online free', 'sora video download', 'watermark free sora video'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Free Sora Watermark Remover.'
    },
    {
        file: 'sora-batch-watermark-removal-tool.jpg',
        title: 'Batch Sora Watermark Removal Tool - Process Multiple Videos At Once',
        description: 'Batch remove watermarks from multiple Sora AI videos simultaneously. Process 10+ videos at once and download as ZIP. Free batch watermark removal tool for content creators and video editors.',
        keywords: ['batch sora watermark removal', 'remove multiple sora watermarks', 'batch video processing', 'sora batch mode', 'download sora videos zip', 'bulk watermark removal', 'sora watermark remover batch', 'multiple video download'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Batch Sora Watermark Removal.'
    },
    {
        file: 'ai-video-generation-sora-technology.jpg',
        title: 'AI Video Generation with Sora Technology - OpenAI Text to Video',
        description: 'Sora AI video generation technology by OpenAI creates stunning cinematic videos from text prompts. Learn how AI video generation works and how to use Sora for professional content creation.',
        keywords: ['sora ai video generation', 'openai sora', 'ai video creator', 'text to video ai', 'sora technology', 'ai generated video', 'sora 2026', 'ai video maker', 'openai video generator'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. AI Video Generation Guide.'
    },
    {
        file: 'video-content-creator-workspace-setup.jpg',
        title: 'Content Creator Workspace for AI Video Editing and Production',
        description: 'Professional content creator workspace optimized for editing Sora AI generated videos. Modern setup with equipment for video editing workflow and watermark removal.',
        keywords: ['content creator workspace', 'video editing setup', 'sora video editing', 'ai video creator setup', 'professional video workspace', 'content creation tools', 'video editing workstation'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Content Creator Guide.'
    },
    {
        file: 'sora-video-hd-quality-no-loss.jpg',
        title: 'Sora Video HD Quality - Zero Quality Loss After Watermark Removal',
        description: 'Download Sora videos in original HD quality with zero quality loss after watermark removal. Full 1080p resolution preserved, no re-encoding, no compression artifacts.',
        keywords: ['sora video hd quality', 'no quality loss watermark removal', 'hd sora video download', 'sora 1080p quality', 'watermark removal no quality loss', 'original quality sora video', 'lossless watermark removal'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. HD Quality Preservation.'
    },
    {
        file: 'fast-sora-video-download-speed.jpg',
        title: 'Fast Sora Video Download - 2 Second Instant Watermark Removal',
        description: 'Lightning fast Sora watermark removal and download. Process and download watermark-free HD videos in just 2-10 seconds. Fastest sora watermark remover tool available online.',
        keywords: ['fast sora video download', 'quick watermark removal', '2 second sora watermark', 'instant sora download', 'fastest watermark remover', 'speed sora processing', 'quick sora video download', 'instant download'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Fast Processing.'
    },
    {
        file: 'video-privacy-security-protection.jpg',
        title: 'Video Privacy and Security - Secure Sora Watermark Removal Tool',
        description: 'Your privacy is protected during Sora watermark removal. No videos stored, no data collected, secure processing. Private and safe watermark removal tool for your AI videos.',
        keywords: ['video privacy protection', 'secure watermark removal', 'private sora processing', 'no data stored', 'safe watermark remover', 'sora privacy', 'secure video download', 'privacy first tool'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Privacy Protected.'
    },
    {
        file: 'share-sora-videos-social-media-platforms.jpg',
        title: 'Share Sora Videos on Social Media Without Watermarks - TikTok Instagram YouTube',
        description: 'Share clean, watermark-free Sora AI videos across all social media platforms. TikTok, Instagram, YouTube, Twitter - post professional AI content everywhere without watermarks.',
        keywords: ['share sora videos social media', 'sora video tiktok', 'sora video instagram', 'watermark free social media', 'ai video social sharing', 'post sora video youtube', 'clean ai video social media', 'no watermark tiktok'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Social Media Sharing.'
    },
    {
        file: 'sora-ai-video-generation-interface.jpg',
        title: 'Sora AI Video Generation Interface - OpenAI Text to Video Dashboard',
        description: 'The Sora AI video generation interface by OpenAI. Enter text prompts to create stunning cinematic videos. AI processing, prompt engineering, video preview and generation.',
        keywords: ['sora interface', 'sora ai interface', 'sora text to video', 'openai sora ui', 'sora prompt input', 'ai video generator interface', 'sora dashboard', 'sora video creation'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Sora Interface Guide.'
    },
    {
        file: 'video-editing-tools-watermark-removal.jpg',
        title: 'Video Editing Tools for AI Watermark Removal - Best Tools 2026',
        description: 'Essential video editing tools for removing watermarks from AI generated content. Timeline editing, effects, filters, and professional tools for video post-production.',
        keywords: ['video editing tools', 'watermark removal tools', 'ai video editing', 'video editing software', 'remove watermark tools', 'best video editing tools 2026', 'ai watermark editor'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Video Editing Tools.'
    },
    {
        file: 'ai-neural-network-deep-learning-video.jpg',
        title: 'AI Neural Network for Video Generation and Processing Technology',
        description: 'Deep learning neural network architecture powering AI video generation and watermark removal. How AI processes and generates cinematic video content using transformers.',
        keywords: ['ai neural network video', 'deep learning video', 'neural network video generation', 'ai video processing', 'machine learning video', 'sora neural network', 'ai architecture video', 'transformer video'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. AI Technology.'
    },
    {
        file: 'mobile-sora-video-editing-app.jpg',
        title: 'Mobile Sora Video Editing - Remove Watermark on iPhone and Android',
        description: 'Remove Sora watermarks on mobile devices. Works on iPhone, iPad, and Android. No app download needed - browser-based watermark removal on any device, anywhere.',
        keywords: ['mobile sora watermark removal', 'sora watermark iphone', 'remove sora watermark android', 'mobile video editing', 'sora watermark remover mobile', 'phone watermark removal', 'mobile ai video'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Mobile Support.'
    },
    {
        file: 'before-after-sora-watermark-removal-comparison.jpg',
        title: 'Before and After Sora Watermark Removal - Quality Comparison Results',
        description: 'Side-by-side comparison showing Sora video before and after watermark removal. Crystal clear HD quality preserved with zero degradation. See the results.',
        keywords: ['before after sora watermark', 'watermark removal comparison', 'sora watermark before after', 'visual comparison watermark', 'quality comparison sora', 'watermark removal results', 'sora clean video comparison'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Quality Comparison.'
    },
    {
        file: 'cloud-video-processing-server.jpg',
        title: 'Cloud Video Processing Server for Sora Watermark Removal Service',
        description: 'Cloud-based server infrastructure for processing Sora AI videos. Fast, reliable, and scalable watermark removal powered by cloud computing technology.',
        keywords: ['cloud video processing', 'sora cloud server', 'online video processing', 'cloud watermark removal', 'server video processing', 'cloud based sora tool', 'scalable video processing'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Cloud Processing.'
    },
    {
        file: 'video-analytics-trending-performance.jpg',
        title: 'Video Analytics and Performance Tracking for AI Generated Content',
        description: 'Track video performance analytics for AI-generated content. Monitor views, engagement, CTR, and growth metrics. Optimize your Sora video content strategy.',
        keywords: ['video analytics', 'ai video performance', 'content analytics dashboard', 'video tracking metrics', 'sora video analytics', 'content performance', 'video engagement metrics'],
        author: 'SoraWatermarkRemover',
        copyright: '© 2026 SoraWatermarkRemover. Video Analytics.'
    },
];

// Logo metadata
const LOGO_SEO = {
    file: 'logo.png',
    title: 'SoraWatermarkRemover Logo - Free Sora Watermark Remover Tool',
    description: 'SoraWatermarkRemover official logo. The best free online tool to remove Sora AI watermarks from videos. Instant processing, HD quality, no signup required.',
    keywords: ['sorawatermarkremover logo', 'sora watermark remover logo', 'sorawatermarkremover brand', 'sora tool logo', 'watermark remover brand', 'sorawatermarkremover icon'],
    author: 'SoraWatermarkRemover',
    copyright: '© 2026 SoraWatermarkRemover. All rights reserved.'
};

async function processImage(filePath, meta) {
    try {
        // Write IPTC, XMP, and EXIF metadata using exiftool
        // This writes to ALL standard metadata fields so macOS, Windows, and Linux can read them
        await exiftool.write(filePath, {
            // IPTC fields (macOS Get Info reads these)
            'IPTC:Caption-Abstract': meta.description,
            'IPTC:Headline': meta.title,
            'IPTC:Keywords': meta.keywords,
            'IPTC:By-line': meta.author,
            'IPTC:CopyrightNotice': meta.copyright,
            'IPTC:ObjectName': meta.title,

            // XMP fields (universal, also read by macOS)
            'XMP:Title': meta.title,
            'XMP:Description': meta.description,
            'XMP:Subject': meta.keywords,
            'XMP:Creator': meta.author,
            'XMP:Rights': meta.copyright,

            // EXIF fields (browser/SEO tools read these)
            'EXIF:ImageDescription': meta.description,
            'EXIF:Artist': meta.author,
            'EXIF:Copyright': meta.copyright,
            'EXIF:UserComment': `${meta.title} | Keywords: ${meta.keywords.join(', ')} | ${meta.description}`,
            'EXIF:XPTitle': meta.title,
            'EXIF:XPComment': meta.description,
            'EXIF:XPKeywords': meta.keywords.join('; '),
            'EXIF:XPAuthor': meta.author,
            'EXIF:XPSubject': meta.description,
        }, ['-overwrite_original']);

        return true;
    } catch (err) {
        console.error(`  ❌ Error processing ${filePath}: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('⚡ SoraWatermarkRemover Image SEO Metadata Injector');
    console.log('==========================================\n');

    let successCount = 0;
    let totalCount = IMAGE_SEO.length + 1; // +1 for logo

    // Process blog images
    console.log('📸 Processing blog images...\n');
    for (const meta of IMAGE_SEO) {
        const filePath = path.join(BLOG_IMAGES_DIR, meta.file);
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠️  Skip (not found): ${meta.file}`);
            continue;
        }

        const success = await processImage(filePath, meta);
        if (success) {
            console.log(`  ✅ ${meta.file}`);
            console.log(`     Title: ${meta.title}`);
            console.log(`     Keywords: ${meta.keywords.slice(0, 4).join(', ')}...`);
            console.log(`     Description: ${meta.description.slice(0, 80)}...`);
            successCount++;
        }
    }

    // Process logo (PNG)
    console.log('\n🎨 Processing logo...\n');
    const logoPath = path.join(PUBLIC_DIR, LOGO_SEO.file);
    if (fs.existsSync(logoPath)) {
        const success = await processImage(logoPath, LOGO_SEO);
        if (success) {
            console.log(`  ✅ logo.png (metadata injected)`);
            successCount++;
        }
    } else {
        console.log('  ⚠️  logo.png not found, skipping');
    }

    console.log(`\n🎉 Done! Injected metadata into ${successCount}/${totalCount} images`);
    console.log('\n📋 Metadata fields written per image:');
    console.log('   - IPTC: Caption, Headline, Keywords, By-line, Copyright (macOS Get Info)');
    console.log('   - XMP: Title, Description, Subject, Creator, Rights (universal)');
    console.log('   - EXIF: ImageDescription, Artist, Copyright, UserComment (SEO)');
    console.log('   - EXIF XP: Title, Keywords, Comment, Author, Subject (Windows)\n');

    // Shutdown exiftool process
    await exiftool.end();
}

main().catch(err => {
    console.error(err);
    exiftool.end();
});
