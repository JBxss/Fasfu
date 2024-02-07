import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject } from 'rxjs';

interface CartData {
  products: any[],
  total: number,
}
@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartData: CartData = {
    products: [],
    total: 0,
  };

  cartDataObs$ = new BehaviorSubject(this.cartData);

  constructor(
    private _notification: NzNotificationService,
    private _api: ApiService
  ) {
    let localCartData = JSON.parse(localStorage.getItem('cart')?? "");
    if (localCartData) this.cartData = localCartData;

    this.cartDataObs$.next(this.cartData);
  }

  submitCheckout(userId: any, cart: any) {
    return this._api.postTypeRequest('orders/create', {
      userId: userId,
      cart: cart,
    });
  }

  addProduct(params: any): void {
    const { id, price, quantity, image, title, maxQuantity } = params;
    const product = { id, price, quantity, image, title, maxQuantity };

    if (!this.isProductInCart(id)) {
      if (quantity) this.cartData.products.push(product);
      else this.cartData.products.push({ ...product, quantity: 1 });
    } else {
      // copy array, find item index and update
      let updatedProducts: any = [...this.cartData.products];
      let productIndex = updatedProducts.findIndex((prod: any) => prod.id == id);
      let product = updatedProducts[productIndex];

      // if no quantity, increment
      if (quantity) {
        updatedProducts[productIndex] = {
          ...product,
          quantity: quantity,
        };
      } else {
        updatedProducts[productIndex] = {
          ...product,
          quantity: product.quantity + 1,
        };
      }

      console.log(updatedProducts);
      this.cartData.products = updatedProducts;
    }

    this.cartData.total = this.getCartTotal();
    this._notification.create(
      'success',
      'Product added to cart',
      `${title} was successfully added to the cart`
    );
    this.cartDataObs$.next({ ...this.cartData });
    localStorage.setItem('cart', JSON.stringify(this.cartData));
  }

  updateCart(id: number, quantity: number): void {
    // copy array, find item index and update
    let updatedProducts: any = [...this.cartData.products];
    let productIndex = updatedProducts.findIndex((prod: any) => prod.id == id);

    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      quantity: quantity,
    };

    this.cartData.products = updatedProducts;
    this.cartData.total = this.getCartTotal();
    this.cartDataObs$.next({ ...this.cartData });
    console.log(this.cartData.products);
    localStorage.setItem('cart', JSON.stringify(this.cartData));
  }

  removeProduct(id: number): void {
    let updatedProducts = this.cartData.products.filter(
      (prod: any) => prod.id !== id
    );
    this.cartData.products = updatedProducts;
    this.cartData.total = this.getCartTotal();
    this.cartDataObs$.next({ ...this.cartData });
    localStorage.setItem('cart', JSON.stringify(this.cartData));

    this._notification.create(
      'success',
      'Removed successfully',
      'The selected item was removed from the cart successfully'
    );
  }

  clearCart(): void {
    this.cartData = {
      products: [],
      total: 0,
    };
    this.cartDataObs$.next({ ...this.cartData });
    localStorage.setItem('cart', JSON.stringify(this.cartData));
  }

  getCartTotal(): number {
    let totalSum = 0;
    this.cartData.products.forEach(
      (prod: any) => (totalSum += prod.price * prod.quantity)
    );

    return totalSum;
  }

  isProductInCart(id: number): boolean {
    return this.cartData.products.findIndex((prod: any) => prod.id === id) !== -1;
  }
}
