import { ModelFile } from '../../../common/components/three-dimension/business/models/types';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { SettingMapModelBusiness } from './setting-map-model.business';
import { MapElementModel } from './setting-map.model';

export class SettingMapElementBusiness {
  constructor(
    private service: GeographicRequestService,
    private model: SettingMapModelBusiness,
  ) {}

  async load(type: MapElementType): Promise<MapElementModel[]> {
    let params = new GetMapElementsParams();
    params.ElementTypes = [type];
    const [elements, models] = await Promise.all([
      this.service.map.element.all(params),
      this.model.load(),
    ]);
    return elements.map((e) => this.convert.element(e, models));
  }

  bind(
    data: VideoChannel,
    location: { x: number; y: number; z: number },
    mapId: string,
    modelId: string,
    parentId?: string,
  ) {
    let element = this.convert.channel(data, location, mapId, modelId, parentId);
    return this.service.map.element.create(element);
  }
  unbind(id: string) {
    return this.service.map.element.delete(id);
  }

  private convert = {
    element: (element: GeoMapElement, models: ModelFile[]) => {
      let result = Object.assign(new MapElementModel(), element);
      result.file = models.find((m) => {
        if (element.Description && element.Description.includes(m.name)) return true;
        return m.name === element.ElementId;
      });
      return result;
    },
    channel: (
      data: VideoChannel,
      location: { x: number; y: number; z: number },
      mapId: string,
      modelId: string,
      parentId?: string,
    ) => {
      let element = new GeoMapElement();
      element.Location = new GisPoint();
      element.Location.Longitude = location.x;
      element.Location.Latitude = location.z;
      element.Location.Altitude = location.y;
      element.Location.GisType = GisType.Other;

      element.Id = '';
      element.CreateTime = new Date();
      element.UpdateTime = new Date();

      element.ElementId = data.Id;
      element.ElementType = MapElementType.Camera;
      element.Name = data.Name;
      element.MapId = mapId;
      element.ParentId = parentId;
      element.Tags = [modelId];
      return element;
    },
  };
}
