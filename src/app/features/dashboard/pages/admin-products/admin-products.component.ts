import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProductService } from '../../../../core/services/product.service';
import { Product, ProductImage, ProductVariant } from '../../../../core/models/product.model';
import { firstValueFrom, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css'],
  standalone: false
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  showAddForm = false;
  productForm: FormGroup;

  // Filters
  searchTerm = '';
  filterBrand = '';
  filterStatus = '';
  sortDate = '';

  // Image upload (create mode)
  featured1File: File | null = null;
  featured1Preview: SafeUrl | null = null;
  featured2File: File | null = null;
  featured2Preview: SafeUrl | null = null;
  selectedImages: File[] = [];
  imagePreviews: SafeUrl[] = [];
  isSubmitting = false;

  // Edit modal
  editProduct: Product | null = null;
  editForm: FormGroup;
  editFeatured1File: File | null = null;
  editFeatured1Preview: SafeUrl | null = null;
  editFeatured2File: File | null = null;
  editFeatured2Preview: SafeUrl | null = null;
  editSelectedImages: File[] = [];
  editImagePreviews: SafeUrl[] = [];
  isEditSubmitting = false;

  // Stock adjust
  adjustVariant: { productId: string; variant: ProductVariant } | null = null;
  stockAdjustments: { [key: string]: number } = {};

  // Delete confirm
  confirmDelete: Product | null = null;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      brand_name: [''],
      short_description: [''],
      description: [''],
      status: ['draft', Validators.required],
      is_featured: [false]
    });

    this.editForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      brand_name: [''],
      short_description: [''],
      description: [''],
      status: ['draft', Validators.required],
      is_featured: [false]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.brokenImages.clear();
    this.productService.list({ limit: 100 }).subscribe({
      next: (res: { products: Product[]; pagination: any }) => {
        this.products = res.products;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  productId(p: Product): string {
    return (p.id ?? p._id) as string;
  }

  variantId(v: ProductVariant): string {
    return (v.id ?? v._id) as string;
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  generateSlug(name: string): void {
    this.productForm.patchValue({
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.productForm.reset({ status: 'draft', is_featured: false });
      this.resetCreateImages();
    }
  }

  private resetCreateImages(): void {
    this.featured1File = null;
    this.featured1Preview = null;
    this.featured2File = null;
    this.featured2Preview = null;
    this.selectedImages = [];
    this.imagePreviews = [];
  }

  private makePreview(file: File): SafeUrl {
    const reader = new FileReader();
    let preview: SafeUrl | null = null;
    reader.onload = () => {
      preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    return preview!;
  }

  // ─── Featured 1 Upload ─────────────────────────────────────────────────────
  onFeatured1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.featured1File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.featured1Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.featured1File);
    input.value = '';
  }

  removeFeatured1(): void {
    this.featured1File = null;
    this.featured1Preview = null;
  }

  // ─── Featured 2 Upload ─────────────────────────────────────────────────────
  onFeatured2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.featured2File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.featured2Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.featured2File);
    input.value = '';
  }

  removeFeatured2(): void {
    this.featured2File = null;
    this.featured2Preview = null;
  }

  // ─── Other Images Upload ───────────────────────────────────────────────────
  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const file of Array.from(input.files)) {
      if (this.selectedImages.length >= 3) break;
      this.selectedImages.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(
          this.sanitizer.bypassSecurityTrustUrl(reader.result as string)
        );
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  private async uploadAllImages(productId: string): Promise<void> {
    if (this.featured1File) {
      try {
        await firstValueFrom(this.productService.uploadFeatured1(productId, this.featured1File));
      } catch (err) {
        console.error('Failed to upload featured1:', err);
      }
    }
    if (this.featured2File) {
      try {
        await firstValueFrom(this.productService.uploadFeatured2(productId, this.featured2File));
      } catch (err) {
        console.error('Failed to upload featured2:', err);
      }
    }
    for (let i = 0; i < this.selectedImages.length; i++) {
      try {
        await firstValueFrom(this.productService.addImage(productId, this.selectedImages[i], undefined, 10 + i));
      } catch (err) {
        console.error(`Failed to upload image ${i}:`, err);
      }
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.productService.create(this.productForm.value).pipe(
      switchMap((product: Product) => {
        const id = product.id ?? (product as any)._id;
        if (!id || (!this.featured1File && !this.featured2File && !this.selectedImages.length)) return of(product);
        return this.uploadAllImages(id).then(() => product);
      })
    ).subscribe({
      next: () => {
        this.loadProducts();
        this.showAddForm = false;
        this.productForm.reset({ status: 'draft', is_featured: false });
        this.resetCreateImages();
        this.isSubmitting = false;
      },
      error: () => { this.isSubmitting = false; }
    });
  }

  // ─── Edit ────────────────────────────────────────────────────────────────────

  openEditModal(product: Product): void {
    this.editProduct = product;
    this.editSelectedImages = [];
    this.editImagePreviews = [];
    this.editForm.patchValue({
      name: product.name,
      slug: product.slug,
      brand_name: product.brand_name ?? '',
      short_description: product.short_description ?? '',
      description: product.description ?? '',
      status: product.status,
      is_featured: product.is_featured
    });
  }

  closeEditModal(): void {
    this.editProduct = null;
    this.editFeatured1File = null;
    this.editFeatured1Preview = null;
    this.editFeatured2File = null;
    this.editFeatured2Preview = null;
    this.editSelectedImages = [];
    this.editImagePreviews = [];
    this.isEditSubmitting = false;
  }

  generateEditSlug(name: string): void {
    this.editForm.patchValue({
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  }

  // ─── Edit Featured 1 ───────────────────────────────────────────────────────
  onEditFeatured1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.editFeatured1File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.editFeatured1Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.editFeatured1File);
    input.value = '';
  }

  removeEditFeatured1(): void {
    this.editFeatured1File = null;
    this.editFeatured1Preview = null;
  }

  // ─── Edit Featured 2 ───────────────────────────────────────────────────────
  onEditFeatured2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.editFeatured2File = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.editFeatured2Preview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.editFeatured2File);
    input.value = '';
  }

  removeEditFeatured2(): void {
    this.editFeatured2File = null;
    this.editFeatured2Preview = null;
  }

  // ─── Edit Other Images ─────────────────────────────────────────────────────
  onEditImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const file of Array.from(input.files)) {
      if (this.editSelectedImages.length >= 3) break;
      this.editSelectedImages.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreviews.push(
          this.sanitizer.bypassSecurityTrustUrl(reader.result as string)
        );
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeEditNewImage(index: number): void {
    this.editSelectedImages.splice(index, 1);
    this.editImagePreviews.splice(index, 1);
  }

  deleteExistingImage(productId: string, image: ProductImage): void {
    const imageId = image.id ?? image._id!;
    this.productService.deleteImage(productId, imageId).subscribe({
      next: () => {
        if (this.editProduct?.images) {
          this.editProduct.images = this.editProduct.images.filter(
            (img) => (img.id ?? img._id) !== imageId
          );
        }
      },
      error: (err) => {
        console.error('Failed to delete image:', err);
      }
    });
  }

  onEditSubmit(): void {
    if (!this.editProduct || this.editForm.invalid || this.isEditSubmitting) return;
    this.isEditSubmitting = true;
    const id = this.productId(this.editProduct);

    this.productService.update(id, this.editForm.value).pipe(
      switchMap(async () => {
        if (this.editFeatured1File) {
          await firstValueFrom(this.productService.uploadFeatured1(id, this.editFeatured1File));
        }
        if (this.editFeatured2File) {
          await firstValueFrom(this.productService.uploadFeatured2(id, this.editFeatured2File));
        }
        for (let i = 0; i < this.editSelectedImages.length; i++) {
          await firstValueFrom(this.productService.addImage(id, this.editSelectedImages[i], undefined, 10 + i));
        }
      })
    ).subscribe({
      next: () => {
        this.loadProducts();
        this.closeEditModal();
      },
      error: () => { this.isEditSubmitting = false; }
    });
  }

  // ─── Stock ───────────────────────────────────────────────────────────────────

  openAdjustStock(productId: string, variant: ProductVariant): void {
    this.adjustVariant = { productId, variant };
    this.stockAdjustments[`${productId}-${this.variantId(variant)}`] = 0;
  }

  closeAdjustStock(): void { this.adjustVariant = null; }

  submitAdjustStock(productId: string, variantId: string): void {
    const delta = this.stockAdjustments[`${productId}-${variantId}`];
    if (delta === undefined || delta === 0) return;
    this.productService.adjustStock(productId, variantId, delta).subscribe({
      next: () => { this.loadProducts(); this.closeAdjustStock(); }
    });
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  confirmDeleteProduct(product: Product): void { this.confirmDelete = product; }
  cancelDelete(): void { this.confirmDelete = null; }

  executeDelete(id: string): void {
    this.productService.remove(id).subscribe({
      next: () => { this.loadProducts(); this.confirmDelete = null; }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  brokenImages: Set<string> = new Set();

  get editHasFeatured1(): boolean {
    return !!this.editProduct?.images?.some(i => i.featured1);
  }

  get editHasFeatured2(): boolean {
    return !!this.editProduct?.images?.some(i => i.featured2);
  }

  onImageLoad(product: Product): void {
    console.debug('[Image] Loaded OK:', product.name);
  }

  onImageError(product: Product): void {
    const id = this.productId(product);
    this.brokenImages.add(id);
    const url = this.getMainImage(product);
    console.warn('[Image] Failed to load:', url, 'for product:', product.name, 'id:', id);
  }

  showMainImage(product: Product): boolean {
    const url = this.getMainImage(product);
    return !!url && !this.brokenImages.has(this.productId(product));
  }

  getImageUrl(img: ProductImage): string {
    const url = img.image_url;
    if (!url) return '';
    if (url.startsWith('/api/uploads/')) return url;
    if (url.startsWith('/uploads/')) return '/api' + url;
    if (url.startsWith('uploads/')) return '/api/' + url;
    return url;
  }

  getMainImage(product: Product): string | null {
    if (!product.images?.length) return null;
    const img = product.images.find(i => i.featured1) || product.images.find(i => i.is_main) || product.images[0];
    return this.getImageUrl(img);
  }

  totalStock(variants: ProductVariant[]): number {
    return variants.reduce((sum, v) => sum + v.stock_qty, 0);
  }
}
