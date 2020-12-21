import os 

def create_file(request):

    if request.method == 'POST':
        filename = request.POST.get('video-filename', '')
        file = request.FILES.get('video-blob', '')
        if file:
                if not os.path.exists('static/video-msg/'):
                        os.mkdir('static/video-msg/')

                with open('static/video-msg/' + filename, 'wb+') as
destination:
                        for chunk in file.chunks():
                                destination.write(chunk)
                return HttpResponse('Created!')
        else:
            return HttpResponse("Blob getting Error")

    else:
        return HttpResponse("No Request given")
