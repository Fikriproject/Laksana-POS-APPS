<?php

namespace Tests\Services;

use PHPUnit\Framework\TestCase;
use App\Services\ProductService;
use App\Models\Product;
use App\Models\Category;

class ProductServiceTest extends TestCase
{
    private $productModel;
    private $categoryModel;
    private $service;

    protected function setUp(): void
    {
        $this->productModel = $this->createMock(Product::class);
        $this->categoryModel = $this->createMock(Category::class);
        $this->service = new ProductService($this->productModel, $this->categoryModel);
    }

    public function testGetAllTransformsImageUrls()
    {
        $mockProducts = [
            [
                'id' => '1',
                'name' => 'Test Product',
                'image_url' => 'http://127.0.0.1:8000/uploads/test.jpg'
            ]
        ];

        // Ensure we're in a mocked environment for $_SERVER
        $_SERVER['HTTPS'] = 'off';
        $_SERVER['HTTP_HOST'] = 'localhost:8000';

        // Mock findAllWithCategory to return array
        $this->productModel->method('findAllWithCategory')->willReturn($mockProducts);
        $this->productModel->method('count')->willReturn(1);

        $result = $this->service->getAll();

        // Check if transform logic works (strips domain)
        $this->assertEquals('/uploads/test.jpg', $result['products'][0]['image_url']);
    }

    public function testCreateGeneratesSku()
    {
        $data = ['name' => 'Kopi Susu', 'price' => 15000];
        
        $this->productModel->expects($this->once())
            ->method('create')
            ->with($this->callback(function($arg) {
                return !empty($arg['sku']) && str_starts_with($arg['sku'], 'SKU-KOP');
            }))
            ->willReturn('new-id');

        $this->service->create($data);
    }
}
