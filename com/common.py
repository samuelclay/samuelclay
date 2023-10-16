from django.shortcuts import render
from django.template import RequestContext

def respond(request, template_name, context_dict=None, **kwargs):
    """
    Use this function rather than render_to_response directly. The idea is to ensure
    that we're always using RequestContext. It's too easy to forget.
    """
    if not context_dict:
        context_dict = {}
        
    return render(request, template_name, **kwargs)
