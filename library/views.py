from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from .forms import UserRegistrationForm
from .models import Book, BorrowedBook, UserProfile
from datetime import datetime, timedelta
import json
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Count
from django.urls import reverse

def home(request):
    stats = None
    if request.user.is_authenticated and request.user.is_superuser:
        stats = {
            'total_books': Book.objects.count(),
            'total_regular_users': User.objects.filter(is_superuser=False).count(),
            'unavailable_books': Book.objects.filter(available_copies=0).count(),
        }
    return render(request, 'library/home.html', {'stats': stats})

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'redirect_url': reverse('home')
                })
            return redirect('home')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors,
                    'message': 'Please correct the errors below.'
                })
    else:
        form = UserRegistrationForm()
    
    return render(request, 'library/register.html', {'form': form})

@login_required
def book_list(request):
    books = Book.objects.all()
    return render(request, 'library/book_list.html', {'books': books})

@login_required
def borrowed_books(request):
    if request.user.is_superuser:
        borrowed = BorrowedBook.objects.filter(returned=False)
    else:
        borrowed = BorrowedBook.objects.filter(user=request.user, returned=False)
    return render(request, 'library/borrowed_books.html', {'borrowed_books': borrowed})

@login_required
@require_POST
def borrow_book(request):
    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        book = Book.objects.get(id=book_id)
        
        if book.available_copies > 0:
            BorrowedBook.objects.create(
                book=book,
                user=request.user,
                due_date=datetime.now() + timedelta(days=14)
            )
            
            book.available_copies -= 1
            book.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Book borrowed successfully'
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'No copies available'
            }, status=400)
    except Book.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Book not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_POST
def return_book(request):
    try:
        data = json.loads(request.body)
        borrowed_id = data.get('borrowed_id')
        borrowed = BorrowedBook.objects.get(id=borrowed_id, user=request.user)
        
        if not borrowed.returned:
            borrowed.returned = True
            borrowed.returned_date = datetime.now()
            borrowed.save()
            
            book = borrowed.book
            book.available_copies += 1
            book.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Book returned successfully'
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Book already returned'
            }, status=400)
    except BorrowedBook.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Borrowed book not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

def is_admin(user):
    return user.is_superuser

@user_passes_test(is_admin)
def add_book(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        author = request.POST.get('author')
        image_url = request.POST.get('image_url', '')
        description = request.POST.get('description')
        available_copies = request.POST.get('available_copies', 0)
        
        try:
            available_copies = int(available_copies)
        except (ValueError, TypeError):
            available_copies = 0

        Book.objects.create(
            title=title,
            author=author,
            image_url=image_url,
            description=description,
            available_copies=available_copies
        )
        messages.success(request, 'Book added successfully!')
        return redirect('book_list')
    return render(request, 'library/add_book.html')

@user_passes_test(is_admin)
def edit_book(request, book_id):
    book = Book.objects.get(id=book_id)
    if request.method == 'POST':
        book.title = request.POST.get('title')
        book.author = request.POST.get('author')
        book.image_url = request.POST.get('image_url', '')
        book.description = request.POST.get('description')
        available_copies_str = request.POST.get('available_copies', '')
        
        try:
            available_copies = int(available_copies_str)
            book.available_copies = available_copies
        except (ValueError, TypeError):
            pass

        book.save()
        messages.success(request, 'Book updated successfully!')
        return redirect('book_list')
    return render(request, 'library/edit_book.html', {'book': book})

@user_passes_test(is_admin)
def delete_book(request, book_id):
    book = Book.objects.get(id=book_id)
    book.delete()
    messages.success(request, 'Book deleted successfully!')
    return redirect('book_list')

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

@ensure_csrf_cookie
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Login successful!',
                    'redirect_url': reverse('home')
                })
            messages.success(request, 'Login successful!')
            return redirect('home')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid username or password.',
                    'errors': {
                        '__all__': ['Invalid username or password.']
                    }
                }, status=400)
            messages.error(request, 'Invalid username or password.')
    
    return render(request, 'library/login.html')

@require_http_methods(["GET", "POST"])
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'redirect_url': reverse('login')
            })
        return redirect('login')
    return redirect('home')
