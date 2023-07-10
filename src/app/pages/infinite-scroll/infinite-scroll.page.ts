import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PortService } from '../../services';
import { Port } from '../../types';
import { FormsModule } from '@angular/forms';
import { IonicSelectableComponent } from '../../components/ionic-selectable/ionic-selectable.component';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'infinite-scroll',
    templateUrl: './infinite-scroll.page.html',
    styleUrls: ['./infinite-scroll.page.scss'],
    standalone: true,
    imports: [IonicModule, IonicSelectableComponent, FormsModule]
})
export class InfiniteScrollPage implements OnInit {
  ports: Port[];
  port: Port;
  page = 2;
  portsSubscription: Subscription;

  constructor(
    private portService: PortService
  ) { }

  ngOnInit() {
    this.ports = this.portService.getPorts();
  }

  filterPorts(ports: Port[], text: string) {
    return ports.filter(port => {
      return port.name.toLowerCase().indexOf(text) !== -1 ||
        port.country.name.toLowerCase().indexOf(text) !== -1;
    });
  }

  searchPorts(event: {
    component: IonicSelectableComponent,
    text: string
  }) {
    const text = event.text.trim().toLowerCase();
    event.component.startSearch();

    // Close any running subscription.
    if (this.portsSubscription) {
      this.portsSubscription.unsubscribe();
    }

    if (!text) {
      // Close any running subscription.
      if (this.portsSubscription) {
        this.portsSubscription.unsubscribe();
      }

      event.component.items = this.portService.getPorts(1, 15);

      // Enable and start infinite scroll from the beginning.
      this.page = 2;
      event.component.endSearch();
      event.component.enableInfiniteScroll();
      return;
    }

    this.portsSubscription = this.portService.getPortsAsync().subscribe(ports => {
      // Subscription will be closed when unsubscribed manually.
      if (this.portsSubscription.closed) {
        return;
      }

      event.component.items = this.filterPorts(ports, text);
      event.component.endSearch();
    });
  }

  getMorePorts(event: {
    component: IonicSelectableComponent,
    text: string
  }) {
    const text = (event.text || '').trim().toLowerCase();

    // There're no more ports - disable infinite scroll.
    if (this.page > 3) {
      event.component.disableInfiniteScroll();
      return;
    }

    this.portService.getPortsAsync(this.page, 15).subscribe(ports => {
      ports = event.component.items.concat(ports);

      if (text) {
        ports = this.filterPorts(ports, text);
      }

      event.component.items = ports;
      event.component.endInfiniteScroll();
      this.page++;
    });
  }
}
