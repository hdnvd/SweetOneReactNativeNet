// @flow
class ComponentHelper{

    static appendImageSelectorToFormDataIfNotNull(FormData,FieldName,ImageSelectorValue)
    {
        const path=ComponentHelper.getImageSelectorNormalPath(ImageSelectorValue);
        if(path!=null)
            FormData.append(FieldName, path);
        return FormData;
    }
    static getImageSelectorNormalPath(ImageSelectorValue)
    {
        if(ImageSelectorValue!='' && ImageSelectorValue!=null)
        {

            return({
                uri: 'file://' + ImageSelectorValue,
                type: 'image/jpeg',
                name: 'photo.jpg'
            });
        }
        return null;
    }
}

export default ComponentHelper;
